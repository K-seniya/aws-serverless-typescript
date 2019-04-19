import { Statement } from 'aws-lambda'
import { PolicyDocument } from 'aws-lambda'
import { ConditionBlock } from 'aws-lambda'
interface Method {
  resourceArn?: string
  conditions?: ConditionBlock
}
interface Policy {
  principalId: string
  policyDocument: PolicyDocument
}
/**
 * Describes if the policy should be allowed or denied
 */
enum AuthPolicyEffect {
  ALLOW = 'Allow',
  DENY = 'Deny'
}
export interface ApiOptions {
  restApiId: string
  region: string
  stage: string
}
export class AuthPolicy {
  /**
   * A set of existing HTTP verbs supported by API Gateway. This property is here
   * only to avoid spelling mistakes in the policy.
   *
   * @property HttpVerb
   * @type {Object}
   */
  public static HttpVerb = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    HEAD: 'HEAD',
    DELETE: 'DELETE',
    OPTIONS: 'OPTIONS',
    ALL: '*'
  }
  /**
   * The AWS account id the policy will be generated for. This is used to create
   * the method ARNs.
   *
   * @property awsAccountId
   * @type {String}
   */
  private awsAccountId: string
  /**
   * The principal used for the policy, this should be a unique identifier for
   * the end user.
   *
   * @property principalId
   * @type {String}
   */
  private principalId: string
  /**
   * The policy version used for the evaluation. This should always be "2012-10-17"
   *
   * @property version
   * @type {String}
   * @default "2012-10-17"
   */
  private version: string
  /**
   * The regular expression used to validate resource paths for the policy
   *
   * @property pathRegex
   * @type {RegExp}
   * @default '^\/[/.a-zA-Z0-9-\*]+$'
   */
  private pathRegex: RegExp
  // these are the internal lists of allowed and denied methods. These are lists
  // of objects and each object has 2 properties: A resource ARN and a nullable
  // conditions statement.
  // the build method processes these lists and generates the approriate
  // statements for the final policy
  private allowMethods: Method[]
  private denyMethods: Method[]
  private restApiId: string
  private region: string
  private stage: string
  /**
   * AuthPolicy receives a set of allowed and denied methods and generates a valid
   * AWS policy for the API Gateway authorizer. The constructor receives the calling
   * user principal, the AWS account ID of the API owner, and an apiOptions object.
   * The apiOptions can contain an API Gateway RestApi Id, a region for the RestApi, and a
   * stage that calls should be allowed/denied for. For example
   * {
   *   restApiId: "xxxxxxxxxx",
   *   region: "us-east-1",
   *   stage: "dev"
   * }
   *
   * var testPolicy = new AuthPolicy("[principal user identifier]", "[AWS account id]", apiOptions);
   * testPolicy.allowMethod(AuthPolicy.HttpVerb.GET, "/users/username");
   * testPolicy.denyMethod(AuthPolicy.HttpVerb.POST, "/pets");
   * context.succeed(testPolicy.build());
   *
   * @class AuthPolicy
   * @constructor
   */
  constructor(principal, awsAccountId, apiOptions: ApiOptions) {
    this.awsAccountId = awsAccountId
    this.principalId = principal
    this.version = '2012-10-17'
    this.pathRegex = new RegExp('^[/.a-zA-Z0-9-*]+$')
    this.allowMethods = []
    this.denyMethods = []
    if (!apiOptions || !apiOptions.restApiId) {
      this.restApiId = '*'
    } else {
      this.restApiId = apiOptions.restApiId
    }
    if (!apiOptions || !apiOptions.region) {
      this.region = '*'
    } else {
      this.region = apiOptions.region
    }
    if (!apiOptions || !apiOptions.stage) {
      this.stage = '*'
    } else {
      this.stage = apiOptions.stage
    }
  }
  /**
   * Adds an allow "*" statement to the policy.
   *
   * @method allowAllMethods
   */
  public allowAllMethods = () => {
    this.addMethod(AuthPolicyEffect.ALLOW, '*', '*', null)
  }
  /**
   * Adds a deny "*" statement to the policy.
   *
   * @method denyAllMethods
   */
  public denyAllMethods = () => {
    this.addMethod(AuthPolicyEffect.DENY, '*', '*', null)
  }
  /**
   * Adds an API Gateway method (Http verb + Resource path) to the list of allowed
   * methods for the policy
   *
   * @method allowMethod
   * @param {String} The HTTP verb for the method, this should ideally come from the
   *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
   * @param {string} The resource path. For example "/pets"
   * @return {void}
   */
  public allowMethod = (verb: string, resource: string) => {
    this.addMethod(AuthPolicyEffect.ALLOW, verb, resource, null)
  }
  /**
   * Adds an API Gateway method (Http verb + Resource path) to the list of denied
   * methods for the policy
   *
   * @method denyMethod
   * @param {String} The HTTP verb for the method, this should ideally come from the
   *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
   * @param {string} The resource path. For example "/pets"
   * @return {void}
   */
  public denyMethod = (verb: string, resource: string) => {
    this.addMethod(AuthPolicyEffect.DENY, verb, resource, null)
  }
  /**
   * Adds an API Gateway method (Http verb + Resource path) to the list of allowed
   * methods and includes a condition for the policy statement. More on AWS policy
   * conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition
   *
   * @method allowMethodWithConditions
   * @param {String} The HTTP verb for the method, this should ideally come from the
   *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
   * @param {string} The resource path. For example "/pets"
   * @param {Object} The conditions object in the format specified by the AWS docs
   * @return {void}
   */
  public allowMethodWithConditions = (
    verb: string,
    resource: string,
    conditions?: ConditionBlock
  ) => {
    this.addMethod(AuthPolicyEffect.ALLOW, verb, resource, conditions)
  }
  /**
   * Adds an API Gateway method (Http verb + Resource path) to the list of denied
   * methods and includes a condition for the policy statement. More on AWS policy
   * conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition
   *
   * @method denyMethodWithConditions
   * @param {String} The HTTP verb for the method, this should ideally come from the
   *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
   * @param {string} The resource path. For example "/pets"
   * @param {Object} The conditions object in the format specified by the AWS docs
   * @return {void}
   */
  public denyMethodWithConditions = (
    verb: string,
    resource: string,
    conditions?: ConditionBlock
  ) => {
    this.addMethod(AuthPolicyEffect.DENY, verb, resource, conditions)
  }
  /**
   * Generates the policy document based on the internal lists of allowed and denied
   * conditions. This will generate a policy with two main statements for the effect:
   * one statement for Allow and one statement for Deny.
   * Methods that includes conditions will have their own statement in the policy.
   *
   * @method build
   * @return {Object} The policy object that can be serialized to JSON.
   */
  public build = (): Policy => {
    if (
      (!this.allowMethods || this.allowMethods.length === 0) &&
      (!this.denyMethods || this.denyMethods.length === 0)
    ) {
      throw new Error('No statements defined for the policy')
    }
    const doc: PolicyDocument = {
      Version: this.version,
      Statement: [
        ...this.getStatementsForEffect(
          AuthPolicyEffect.ALLOW,
          this.allowMethods
        ),
        ...this.getStatementsForEffect(AuthPolicyEffect.DENY, this.denyMethods)
      ]
    }
    return {
      principalId: this.principalId,
      policyDocument: doc
    }
  }
  /**
   * This function loops over an array of objects containing a resourceArn and
   * conditions statement and generates the array of statements for the policy.
   *
   * @method getStatementsForEffect
   * @param {String} The desired effect. This can be "Allow" or "Deny"
   * @param {Array} An array of method objects containing the ARN of the resource
   *                and the conditions for the policy
   * @return {Array} an array of formatted statements for the policy.
   */
  private getStatementsForEffect = (
    effect: AuthPolicyEffect,
    methods: Method[]
  ) => {
    const statements = []
    if (methods.length > 0) {
      const statement: any = this.getEmptyStatement(effect)
      methods.forEach(method => {
        if (!method.conditions || Object.keys(method.conditions).length === 0) {
          statement.Resource.push(method.resourceArn)
        } else {
          const conditionalStatement: any = this.getEmptyStatement(effect)
          conditionalStatement.Resource.push(method.resourceArn)
          conditionalStatement.Condition = method.conditions
          statements.push(conditionalStatement)
        }
      })
      if (statement.Resource !== null && statement.Resource.length > 0) {
        statements.push(statement)
      }
    }
    return statements
  }
  /**
   * Returns an empty statement object prepopulated with the correct action and the
   * desired effect.
   *
   * @method getEmptyStatement
   * @param {String} The effect of the statement, this can be "Allow" or "Deny"
   * @return {Object} An empty statement object with the Action, Effect, and Resource
   *                  properties prepopulated.
   */
  private getEmptyStatement = (effect: AuthPolicyEffect): Statement => {
    const statement: any = {
      Action: 'execute-api:Invoke',
      Effect: effect,
      Resource: []
    }
    return statement as Statement
  }
  /**
   * Adds a method to the internal lists of allowed or denied methods. Each object in
   * the internal list contains a resource ARN and a condition statement. The condition
   * statement can be null.
   *
   * @method addMethod
   * @param {String} The effect for the policy. This can only be "Allow" or "Deny".
   * @param {String} he HTTP verb for the method, this should ideally come from the
   *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
   * @param {String} The resource path. For example "/pets"
   * @param {Object} The conditions object in the format specified by the AWS docs.
   * @return {void}
   */
  private addMethod = (
    effect: AuthPolicyEffect,
    verb: string,
    resource: string,
    conditions?: ConditionBlock
  ) => {
    if (verb !== '*' && !AuthPolicy.HttpVerb.hasOwnProperty(verb)) {
      throw new Error(
        'Invalid HTTP verb ' + verb + '. Allowed verbs in AuthPolicy.HttpVerb'
      )
    }
    if (!this.pathRegex.test(resource)) {
      throw new Error(
        'Invalid resource path: ' +
        resource +
        '. Path should match ' +
        this.pathRegex
      )
    }
    // remove '/' from resource string
    const cleanedResource =
      resource.substring(0, 1) === '/'
        ? resource.substring(1, resource.length)
        : resource
    const resourceArn =
      'arn:aws:execute-api:' +
      this.region +
      ':' +
      this.awsAccountId +
      ':' +
      this.restApiId +
      '/' +
      this.stage +
      '/' +
      verb +
      '/' +
      cleanedResource
    if (effect === AuthPolicyEffect.ALLOW) {
      this.allowMethods.push({
        resourceArn,
        conditions
      })
    } else if (effect === AuthPolicyEffect.DENY) {
      this.denyMethods.push({
        resourceArn,
        conditions
      })
    }
  }
}
