const { JSDOM } = require('jsdom');

describe('DOM Tesztek', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Test Page</title>
        </head>
        <body>
          <div id="root"></div>
          <form id="loginForm">
            <input type="text" id="username" name="username" required />
            <input type="password" id="password" name="password" required />
            <button type="submit" id="submitBtn">Bejelentkezes</button>
          </form>
          <div id="errorMessage" style="display: none;"></div>
        </body>
      </html>
    `, {
      url: "http://localhost",
      pretendToBeVisual: true,
    });

    document = dom.window.document;
    window = dom.window;
  });

  afterEach(() => {
    dom.window.close();
  });

  test('Root elem betoltodik', () => {
    const rootElement = document.getElementById('root');
    expect(rootElement).toBeTruthy();
    expect(rootElement.tagName).toBe('DIV');
  });

  test('Username mezo validacio kitoltott ertekkel', () => {
    const usernameInput = document.getElementById('username');
    usernameInput.value = 'testuser123';

    const isValid = usernameInput.checkValidity();
    expect(isValid).toBe(true);
  });

  test('Form submit esemeny kezeles', () => {
    const loginForm = document.getElementById('loginForm');
    let submitCalled = false;

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      submitCalled = true;
    });

    const submitEvent = new window.Event('submit', { bubbles: true, cancelable: true });
    loginForm.dispatchEvent(submitEvent);

    expect(submitCalled).toBe(true);
  });

  test('Password mezo validacioja kitoltott ertekkel', () => {
    const passwordInput = document.getElementById('password');
    passwordInput.value = 'password123';

    const isValid = passwordInput.checkValidity();
    expect(isValid).toBe(true);
  });

  test('Input mezo ertek beallitasa es lekerese', () => {
    const usernameInput = document.getElementById('username');
    const testUsername = 'johndoe';

    usernameInput.value = testUsername;
    expect(usernameInput.value).toBe(testUsername);
  });
});
