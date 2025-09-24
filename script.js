// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background change on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Cart system
const CART_STORAGE_KEY = 'beemylyf_cart_v1';
const AUTH_USERS_KEY = 'beemylyf_users_v1';
const AUTH_SESSION_KEY = 'beemylyf_session_v1';

const cartState = {
    items: [], // { id, name, priceCents, qty }
};

function parsePriceToCents(priceText) {
    const numeric = priceText.replace(/[^0-9.]/g, '');
    return Math.round(parseFloat(numeric || '0') * 100);
}

function formatCents(cents) {
    return `$${(cents / 100).toFixed(2)}`;
}

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState.items));
}

function loadCart() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        cartState.items = raw ? JSON.parse(raw) : [];
    } catch (e) {
        cartState.items = [];
    }
}

function getItemId(name, priceCents) {
    return `${name}__${priceCents}`;
}

function addToCart(name, priceCents) {
    const id = getItemId(name, priceCents);
    const existing = cartState.items.find(i => i.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cartState.items.push({ id, name, priceCents, qty: 1 });
    }
    saveCart();
    renderCart();
    openCart();
}

function removeFromCart(id) {
    cartState.items = cartState.items.filter(i => i.id !== id);
    saveCart();
    renderCart();
}

function updateQty(id, delta) {
    const item = cartState.items.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(id);
        return;
    }
    saveCart();
    renderCart();
}

function calcSubtotal() {
    return cartState.items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
}

function renderCart() {
    const itemsEl = document.querySelector('[data-cart-items]');
    const countEl = document.querySelector('[data-cart-count]');
    const subtotalEl = document.querySelector('[data-cart-subtotal]');
    const checkoutBtn = document.querySelector('[data-cart-checkout]');

    if (!itemsEl || !countEl || !subtotalEl || !checkoutBtn) return;

    // Count
    const totalCount = cartState.items.reduce((sum, i) => sum + i.qty, 0);
    countEl.textContent = totalCount;

    // Items
    itemsEl.innerHTML = '';
    if (cartState.items.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'cart-empty';
        empty.textContent = 'Your cart is empty.';
        itemsEl.appendChild(empty);
    } else {
        cartState.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'cart-item';

            row.innerHTML = `
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${formatCents(item.priceCents)}</div>
                <div class="cart-item-controls">
                    <div class="qty-controls">
                        <button class="qty-btn" data-qty-dec aria-label="Decrease quantity">−</button>
                        <div class="qty-value">${item.qty}</div>
                        <button class="qty-btn" data-qty-inc aria-label="Increase quantity">＋</button>
                    </div>
                    <button class="remove-item" data-remove>Remove</button>
                </div>
            `;

            // Events
            row.querySelector('[data-qty-dec]').addEventListener('click', () => updateQty(item.id, -1));
            row.querySelector('[data-qty-inc]').addEventListener('click', () => updateQty(item.id, 1));
            row.querySelector('[data-remove]').addEventListener('click', () => removeFromCart(item.id));

            itemsEl.appendChild(row);
        });
    }

    // Subtotal & checkout
    const subtotal = calcSubtotal();
    subtotalEl.textContent = formatCents(subtotal);
    checkoutBtn.disabled = subtotal === 0;
}

function openCart() {
    const drawer = document.querySelector('[data-cart-drawer]');
    const overlay = document.querySelector('[data-cart-overlay]');
    if (!drawer || !overlay) return;
    drawer.classList.add('open');
    overlay.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
}

function closeCart() {
    const drawer = document.querySelector('[data-cart-drawer]');
    const overlay = document.querySelector('[data-cart-overlay]');
    if (!drawer || !overlay) return;
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
}

// Wire up cart UI
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    renderCart();

    const cartBtn = document.querySelector('.cart-button');
    const cartClose = document.querySelector('[data-cart-close]');
    const overlay = document.querySelector('[data-cart-overlay]');
    const checkoutBtn = document.querySelector('[data-cart-checkout]');

    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (overlay) overlay.addEventListener('click', closeCart);

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (!getCurrentUser()) {
                openModal('login');
                return;
            }
            alert('Checkout coming soon!');
        });
    }
});

// Enhance product buttons to add to cart
document.querySelectorAll('.btn-product').forEach(button => {
    button.addEventListener('click', function() {
        const productCard = this.closest('.product-card');
        const productName = productCard.querySelector('.product-name').textContent.trim();
        const productPriceText = productCard.querySelector('.product-price').textContent;
        const priceCents = parsePriceToCents(productPriceText);
        
        addToCart(productName, priceCents);
        
        // Visual feedback
        this.textContent = 'Added!';
        this.style.background = '#27ae60';
        setTimeout(() => {
            this.textContent = 'Add to Cart';
            this.style.background = 'linear-gradient(45deg, #d4af37, #f4d03f)';
        }, 1500);
    });
});

// Auth system (client-side demo)
function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || '[]');
    } catch (e) {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function setCurrentUser(user) {
    if (user) {
        const session = { email: user.email, name: user.name };
        if (user.role) session.role = user.role;
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    } else {
        localStorage.removeItem(AUTH_SESSION_KEY);
    }
    renderAuthState();
}

function getCurrentUser() {
    try {
        const raw = localStorage.getItem(AUTH_SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function renderAuthState() {
    const accountArea = document.querySelector('[data-account-area]');
    const accountSummary = document.querySelector('[data-account-summary]');
    const accountName = document.querySelector('[data-account-name]');
    const adminBtn = document.querySelector('[data-open-admin]');
    const user = getCurrentUser();

    if (!accountArea || !accountSummary) return;

    if (user) {
        accountArea.style.display = 'none';
        accountSummary.classList.remove('hidden');
        if (accountName) accountName.textContent = user.name || user.email;
        if (adminBtn) adminBtn.style.display = user.role === 'admin' ? '' : 'none';
    } else {
        accountArea.style.display = '';
        accountSummary.classList.add('hidden');
        if (accountName) accountName.textContent = '';
        if (adminBtn) adminBtn.style.display = 'none';
    }
}

// Modal controls
function openModal(name) {
    const modal = document.querySelector(`.modal[data-modal="${name}"]`);
    const overlay = document.querySelector('[data-modal-overlay]');
    if (!modal || !overlay) return;
    modal.classList.add('open');
    overlay.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    
    // Refresh admin data when opening admin modal
    if (name === 'admin') {
        renderAdminTables();
    }
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(m => {
        m.classList.remove('open');
        m.setAttribute('aria-hidden', 'true');
    });
    const overlay = document.querySelector('[data-modal-overlay]');
    if (overlay) overlay.classList.remove('open');
}

document.addEventListener('DOMContentLoaded', () => {
    // Wire modal openers
    const openLogin = document.querySelector('[data-open-login]');
    const openSignup = document.querySelector('[data-open-signup]');
    const overlay = document.querySelector('[data-modal-overlay]');
    const openAdmin = document.querySelector('[data-open-admin]');
    if (openLogin) openLogin.addEventListener('click', () => openModal('login'));
    if (openSignup) openSignup.addEventListener('click', () => openModal('signup'));
    if (openAdmin) openAdmin.addEventListener('click', () => openModal('admin'));
    if (overlay) overlay.addEventListener('click', closeModals);
    document.querySelectorAll('[data-modal-close]').forEach(btn => btn.addEventListener('click', closeModals));

    // Switch between modals
    const toSignup = document.querySelector('[data-switch-to-signup]');
    const toLogin = document.querySelector('[data-switch-to-login]');
    if (toSignup) toSignup.addEventListener('click', (e) => { e.preventDefault(); closeModals(); openModal('signup'); });
    if (toLogin) toLogin.addEventListener('click', (e) => { e.preventDefault(); closeModals(); openModal('login'); });

    // Forms
    const signupForm = document.querySelector('[data-signup-form]');
    const loginForm = document.querySelector('[data-login-form]');
    const logoutBtn = document.querySelector('[data-logout]');

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const [nameInput, emailInput, passInput] = signupForm.querySelectorAll('input');
            const name = nameInput.value.trim();
            const email = emailInput.value.trim().toLowerCase();
            const password = passInput.value;

            if (!name || !email || password.length < 6) {
                alert('Please fill all fields. Password must be at least 6 characters.');
                return;
            }

            const users = getUsers();
            if (users.some(u => u.email === email)) {
                alert('An account with this email already exists.');
                return;
            }
            users.push({ name, email, password });
            saveUsers(users);
            setCurrentUser({ name, email });
            closeModals();
            alert('Account created successfully!');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const [emailInput, passInput] = loginForm.querySelectorAll('input');
            const email = emailInput.value.trim().toLowerCase();
            const password = passInput.value;
            // Admin backdoor login (username: admin, password: 123456789)
            if ((email === 'admin' || email === 'admin@local') && password === '123456789') {
                setCurrentUser({ name: 'Admin', email: 'admin', role: 'admin' });
                closeModals();
                alert('Admin logged in successfully!');
                return;
            }
            const users = getUsers();
            const match = users.find(u => u.email === email && u.password === password);
            if (!match) {
                alert('Invalid email or password.');
                return;
            }
            setCurrentUser({ name: match.name, email: match.email });
            closeModals();
            alert('Logged in successfully!');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            setCurrentUser(null);
        });
    }

    // Render initial state
    renderAuthState();
});

// Purchase recording and exports
const PURCHASES_KEY = 'beemylyf_purchases_v1';

function recordPurchase(items, subtotalCents) {
    const user = getCurrentUser();
    const purchases = getPurchases();
    purchases.push({
        at: new Date().toISOString(),
        user: user ? { email: user.email, name: user.name || '' } : null,
        items: items.map(i => ({ name: i.name, priceCents: i.priceCents, qty: i.qty })),
        subtotalCents
    });
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
}

function getPurchases() {
    try { return JSON.parse(localStorage.getItem(PURCHASES_KEY) || '[]'); } catch { return []; }
}

function downloadText(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

document.addEventListener('DOMContentLoaded', () => {
    // Hook Checkout to record purchase (demo flow)
    const checkoutBtn = document.querySelector('[data-cart-checkout]');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const subtotal = calcSubtotal();
            if (subtotal > 0 && getCurrentUser()) {
                recordPurchase([...cartState.items], subtotal);
            }
        });
    }

    // Admin exports
    const exportProducts = document.querySelector('[data-export-products]');
    const exportCustomers = document.querySelector('[data-export-customers]');
    const exportPurchases = document.querySelector('[data-export-purchases]');
    const exportAdmins = document.querySelector('[data-export-admins]');

    if (exportProducts) exportProducts.addEventListener('click', () => {
        const products = Array.from(document.querySelectorAll('.product-card')).map(card => ({
            name: card.querySelector('.product-name')?.textContent?.trim() || '',
            price: card.querySelector('.product-price')?.textContent?.trim() || ''
        }));
        const lines = [
            'TopBrandSuppliers - Bee MyLyf Products',
            'Format: Name | Price',
            ...products.map(p => `${p.name} | ${p.price}`)
        ].join('\n');
        downloadText('products.txt', lines);
    });

    if (exportCustomers) exportCustomers.addEventListener('click', () => {
        const users = getUsers();
        const lines = [
            'Registered Customers',
            'Format: Name | Email',
            ...users.map(u => `${u.name} | ${u.email}`)
        ].join('\n');
        downloadText('customers.txt', lines);
    });

    if (exportPurchases) exportPurchases.addEventListener('click', () => {
        const purchases = getPurchases();
        const lines = [
            'Purchases',
            'Format: ISO Date | Email | Name | Item x Qty @ Price | Subtotal',
            ...purchases.map(p => {
                const user = p.user ? `${p.user.email} | ${p.user.name}` : 'guest |';
                const items = p.items.map(i => `${i.name} x${i.qty} @ ${formatCents(i.priceCents)}`).join(', ');
                return `${p.at} | ${user} | ${items} | ${formatCents(p.subtotalCents)}`;
            })
        ].join('\n');
        downloadText('purchases.txt', lines);
    });

    if (exportAdmins) exportAdmins.addEventListener('click', () => {
        const lines = [
            'Admins',
            'Format: Name | Username',
            'Admin | admin'
        ].join('\n');
        downloadText('admins.txt', lines);
    });
});

// Admin table rendering
function renderAdminTables() {
    renderUsersTable();
    renderPurchasesTable();
}

function renderUsersTable() {
    const tbody = document.querySelector('[data-users-table] tbody');
    if (!tbody) return;
    
    const users = getUsers();
    tbody.innerHTML = '';
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#999;">No registered users yet</td></tr>';
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name || 'N/A'}</td>
            <td>${user.email}</td>
            <td>Registered</td>
        `;
        tbody.appendChild(row);
    });
}

function renderPurchasesTable() {
    const tbody = document.querySelector('[data-purchases-table] tbody');
    if (!tbody) return;
    
    const purchases = getPurchases();
    tbody.innerHTML = '';
    
    if (purchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999;">No purchases yet</td></tr>';
        return;
    }
    
    purchases.forEach(purchase => {
        const row = document.createElement('tr');
        const date = new Date(purchase.at).toLocaleDateString();
        const customer = purchase.user ? `${purchase.user.name || 'N/A'} (${purchase.user.email})` : 'Guest';
        const items = purchase.items.map(item => `${item.name} x${item.qty}`).join(', ');
        const total = formatCents(purchase.subtotalCents);
        
        row.innerHTML = `
            <td>${date}</td>
            <td>${customer}</td>
            <td>${items}</td>
            <td>${total}</td>
        `;
        tbody.appendChild(row);
    });
}

// Tab switching for admin modal
document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('[data-tab]');
    const tabContents = document.querySelectorAll('[data-tab-content]');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide tab content
            tabContents.forEach(content => {
                if (content.getAttribute('data-tab-content') === targetTab) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    });
});

// Contact form handling
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const name = this.querySelector('input[type="text"]').value;
        const email = this.querySelector('input[type="email"]').value;
        const phone = this.querySelector('input[type="tel"]').value;
        const message = this.querySelector('textarea').value;
        
        // Simple validation
        if (!name || !email || !message) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Simulate form submission
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            alert('Thank you for your message! We will get back to you soon.');
            this.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
    });
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.product-card, .feature, .contact-item');
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Add loading animation for images (if any are added later)
function preloadImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    preloadImages();
    
    // Add a subtle parallax effect to the hero section
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroImage = document.querySelector('.hero-image');
        if (heroImage) {
            heroImage.style.transform = `translateY(${scrolled * 0.1}px)`;
        }
    });
});

// Add hover effects for product cards
document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Add typing effect to hero title (optional enhancement)
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Uncomment the following lines if you want a typing effect for the hero title
// document.addEventListener('DOMContentLoaded', () => {
//     const heroTitle = document.querySelector('.hero-title');
//     if (heroTitle) {
//         const originalText = heroTitle.textContent;
//         typeWriter(heroTitle, originalText, 100);
//     }
// });