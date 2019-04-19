/* global window document localStorage fetch alert */

// Fill in with your values
const AUTH0_CLIENT_ID = 'pMZAZ51sloMymSjdoydsVgo8YgcSYUHH';
const AUTH0_DOMAIN = 'dev-nqc6o1g1.eu.auth0.com';

// initialize auth0 lock
const lock = new Auth0Lock(AUTH0_CLIENT_ID, AUTH0_DOMAIN, { // eslint-disable-line no-undef
  auth: {
    params: {
      scope: 'openid email',
    },
    responseType: 'token id_token',
  },
});

function updateUI() {
  const isLoggedIn = localStorage.getItem('id_token');
  if (isLoggedIn) {
    // swap buttons
    document.getElementById('btn-login').style.display = 'none';
    document.getElementById('btn-logout').style.display = 'inline';
    const profile = JSON.parse(localStorage.getItem('profile'));
    // show username
    document.getElementById('nick').textContent = profile.email;
  }
}

// Handle login
lock.on('authenticated', (authResult) => {
  console.log(authResult);
  lock.getUserInfo(authResult.accessToken, (error, profile) => {
    if (error) {
      // Handle error
      return;
    }
    document.getElementById('nick').textContent = profile.nickname;
    document.getElementById('accessToken').textContent = authResult.accessToken;
    document.getElementById('idToken').textContent = authResult.idToken;
    document.getElementById('profile').textContent = JSON.stringify(profile);
    updateUI();
  });
});

updateUI();

// Handle login
document.getElementById('btn-login').addEventListener('click', () => {
  console.log("lock.show()");
  lock.show();
});

// Handle logout
document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('id_token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('profile');
  document.getElementById('btn-login').style.display = 'flex';
  document.getElementById('btn-logout').style.display = 'none';
  document.getElementById('nick').textContent = '';
});
