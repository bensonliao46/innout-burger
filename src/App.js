import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Double-Double Burger', description: 'Two beef patties, two slices of cheese, fresh lettuce & tomato', price: 5.99 },
    { name: 'Cheeseburger', description: 'Classic single patty burger with melted cheese', price: 3.99 },
    { name: 'French Fries', description: 'Golden, crispy fries made fresh', price: 2.49 },
    { name: 'Shakes', description: 'Chocolate, Strawberry, or Vanilla made with real ice cream', price: 2.99 }
  ];

  const galleryImages = [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&h=400&fit=crop'
  ];

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.name === item.name);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.name === item.name
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (name, change) => {
    setCart(cart.map(item =>
      item.name === name
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = (name) => {
    setCart(cart.filter(item => item.name !== name));
  };

  const clearCart = () => {
    if (window.confirm('Are you sure you want to remove all items from your cart?')) {
      setCart([]);
    }
  };

  const checkout = () => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    alert(`Thank you for your order!\n\nTotal: $${total.toFixed(2)}\n\nYour order will be ready soon!`);
    setCart([]);
    setIsCartOpen(false);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="app">
      {/* Navigation */}
      <header className="header">
        <div className="header-content">
          <div className="logo">In-N-Out Burger</div>
          
          <nav className={`nav ${isMobileMenuOpen ? 'nav-open' : ''}`}>
            {['home', 'menu', 'about', 'contact'].map(page => (
              <button
                key={page}
                onClick={() => {
                  setCurrentPage(page);
                  setIsMobileMenuOpen(false);
                }}
                className={`nav-link ${currentPage === page ? 'active' : ''}`}
              >
                {page.charAt(0).toUpperCase() + page.slice(1)}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <button onClick={() => setIsCartOpen(true)} className="cart-icon">
              🛒
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </button>
            <button 
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {currentPage === 'home' && (
          <div>
            {/* Hero Section */}
            <div className="hero">
              <img src="https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=1600&h=400&fit=crop" alt="Banner" />
              <div className="hero-text">
                <h1>In-N-Out Burger</h1>
                <p>Fresh, Tasty, Iconic</p>
              </div>
            </div>

            {/* Gallery Section */}
            <section className="gallery-section">
              <h2>Our Food & Restaurant</h2>
              <div className="gallery-grid">
                {galleryImages.map((img, idx) => (
                  <div key={idx} className="gallery-item">
                    <img src={img} alt={`Food ${idx + 1}`} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {currentPage === 'menu' && (
          <div className="menu-page">
            <h1>Our Menu</h1>
            <div className="menu-grid">
              {menuItems.map((item, idx) => (
                <div key={idx} className="menu-card">
                  <h2>{item.name}</h2>
                  <p>{item.description}</p>
                  <p className="price">${item.price.toFixed(2)}</p>
                  <button onClick={() => addToCart(item)} className="add-btn">
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentPage === 'about' && (
          <div className="about-page">
            <h1>About In-N-Out Burger</h1>
            <div className="about-content">
              <p>
                In-N-Out Burger started in 1948 with a simple mission: serve fresh, high-quality burgers,
                fries, and shakes to customers who love classic American flavors. Over the years, it has
                become a West Coast favorite, known for its secret menu and commitment to quality ingredients.
              </p>
              <p>
                Every burger is made to order, using fresh beef, crisp lettuce, ripe tomatoes, and
                hand-cut fries. Our focus is on providing a friendly, fast, and enjoyable dining
                experience, whether you're grabbing a quick meal or visiting with family and friends.
              </p>
            </div>
          </div>
        )}

        {currentPage === 'contact' && (
          <div className="contact-page">
            <h1>Contact Us</h1>
            <div className="map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3301.123456789!2d-118.2437!3d34.0522!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2c1234567890%3A0xabcdef123456!2sIn-N-Out+Burger!5e0!3m2!1sen!2sus!4v1690000000000!5m2!1sen!2sus"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                title="Location Map"
              />
            </div>
            <div className="contact-form">
              <div className="form-group">
                <label>Name:</label>
                <input type="text" placeholder="Your name" />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input type="email" placeholder="Your email" />
              </div>
              <div className="form-group">
                <label>Message:</label>
                <textarea rows="5" placeholder="Your message" />
              </div>
              <button onClick={() => alert('Message sent!')} className="submit-btn">
                Send Message
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
          </div>
          <div className="business-hours">
            <p><strong>Business Hours:</strong></p>
            <p>Mon-Fri: 10:00 AM – 10:00 PM</p>
            <p>Sat-Sun: 11:00 AM – 11:00 PM</p>
          </div>
          <p>&copy; 2025 In-N-Out Burger. All rights reserved.</p>
        </div>
      </footer>

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Shopping Cart</h2>
              <div>
                {cart.length > 0 && (
                  <button onClick={clearCart} className="clear-btn">Clear Cart</button>
                )}
                <button onClick={() => setIsCartOpen(false)} className="close-btn">✕</button>
              </div>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">Your cart is empty</div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">${item.price.toFixed(2)} each</div>
                    </div>
                    <div className="cart-item-controls">
                      <button onClick={() => updateQuantity(item.name, -1)} className="qty-btn">−</button>
                      <span className="quantity">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.name, 1)} className="qty-btn">+</button>
                      <button onClick={() => removeFromCart(item.name)} className="remove-btn">Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">Total: ${totalPrice.toFixed(2)}</div>
                <button onClick={checkout} className="checkout-btn">
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;