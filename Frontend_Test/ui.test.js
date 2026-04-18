const { JSDOM } = require('jsdom');

describe('UI Tesztek', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .navbar {
              display: flex;
              background-color: #333;
              padding: 10px;
            }
            .modal {
              display: none;
              position: fixed;
            }
            .modal.active {
              display: block;
            }
            .btn-primary {
              background-color: #007bff;
              color: white;
            }
            .hidden {
              display: none;
            }
          </style>
        </head>
        <body>
          <nav class="navbar">
            <a href="#home">Fooldal</a>
            <a href="#profile">Profil</a>
          </nav>
          <div class="container">
            <button class="btn-primary" id="openModal">Modal megnyitasa</button>
          </div>
          <div class="modal" id="testModal">
            <div class="modal-content">
              <span class="close" id="closeModal">&times;</span>
              <h2>Modal tartalom</h2>
            </div>
          </div>
          <div id="toggleElement" class="hidden">Toggle tartalom</div>
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

  test('Navigacio menu megjelenik', () => {
    const navbar = document.querySelector('.navbar');
    expect(navbar).toBeTruthy();
    expect(navbar.children.length).toBe(2);
  });

  test('CSS osztaly alkalmazasa gombra', () => {
    const button = document.getElementById('openModal');
    expect(button.classList.contains('btn-primary')).toBe(true);
  });

  test('Modal megnyitasa active osztaly hozzaadasaval', () => {
    const modal = document.getElementById('testModal');
    modal.classList.add('active');

    expect(modal.classList.contains('active')).toBe(true);
  });

  test('Gomb kattintas modal megnyitasra', () => {
    const button = document.getElementById('openModal');
    const modal = document.getElementById('testModal');

    button.addEventListener('click', () => {
      modal.classList.add('active');
    });

    button.click();
    expect(modal.classList.contains('active')).toBe(true);
  });

  test('Dinamikus tartalom hozzaadasa', () => {
    const container = document.querySelector('.container');
    const newElement = document.createElement('p');
    newElement.textContent = 'Uj tartalom';
    newElement.id = 'dynamicContent';

    container.appendChild(newElement);

    const addedElement = document.getElementById('dynamicContent');
    expect(addedElement).toBeTruthy();
    expect(addedElement.textContent).toBe('Uj tartalom');
  });
});
