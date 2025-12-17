const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection with caching for serverless
let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    
    cachedConnection = connection;
    console.log('✅ Connected to MongoDB');
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Schemas
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: 'main' },
  available: { type: Boolean, default: true },
  imageUrl: String,
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  items: [{
    name: String,
    price: Number,
    quantity: Number
  }],
  totalPrice: { type: Number, required: true },
  customerInfo: {
    name: String,
    email: String,
    phone: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderDate: { type: Date, default: Date.now },
  notes: String
});

const cartSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  items: [{
    name: String,
    price: Number,
    quantity: Number
  }],
  lastUpdated: { type: Date, default: Date.now }
});

// Models with mongoose.models check for serverless
const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Menu routes
app.get('/api/menu', async (req, res) => {
  try {
    const items = await MenuItem.find({ available: true });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu items', details: error.message });
  }
});

app.get('/api/menu/:id', async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu item', details: error.message });
  }
});

app.post('/api/menu', async (req, res) => {
  try {
    const newItem = new MenuItem(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create menu item', details: error.message });
  }
});

app.put('/api/menu/:id', async (req, res) => {
  try {
    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update menu item', details: error.message });
  }
});

app.delete('/api/menu/:id', async (req, res) => {
  try {
    const deletedItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu item', details: error.message });
  }
});

// Cart routes
app.get('/api/cart/:sessionId', async (req, res) => {
  try {
    let cart = await Cart.findOne({ sessionId: req.params.sessionId });
    if (!cart) {
      cart = new Cart({ sessionId: req.params.sessionId, items: [] });
      await cart.save();
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cart', details: error.message });
  }
});

app.post('/api/cart/:sessionId', async (req, res) => {
  try {
    let cart = await Cart.findOne({ sessionId: req.params.sessionId });
    
    if (!cart) {
      cart = new Cart({
        sessionId: req.params.sessionId,
        items: req.body.items
      });
    } else {
      cart.items = req.body.items;
      cart.lastUpdated = Date.now();
    }
    
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update cart', details: error.message });
  }
});

app.delete('/api/cart/:sessionId', async (req, res) => {
  try {
    await Cart.findOneAndDelete({ sessionId: req.params.sessionId });
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cart', details: error.message });
  }
});

// Order routes
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order', details: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items, totalPrice, customerInfo, notes, sessionId } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    
    const newOrder = new Order({
      items,
      totalPrice,
      customerInfo,
      notes,
      status: 'pending'
    });
    
    await newOrder.save();
    
    if (sessionId) {
      await Cart.findOneAndDelete({ sessionId });
    }
    
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create order', details: error.message });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update order status', details: error.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order', details: error.message });
  }
});

// Seed route
app.get('/api/seed', async (req, res) => {
  try {
    await MenuItem.deleteMany({});
    
    const menuItems = [
      {
        name: 'Double-Double Burger',
        description: 'Two beef patties, two slices of cheese, fresh lettuce & tomato',
        price: 5.99,
        category: 'burgers',
        available: true
      },
      {
        name: 'Cheeseburger',
        description: 'Classic single patty burger with melted cheese',
        price: 3.99,
        category: 'burgers',
        available: true
      },
      {
        name: 'French Fries',
        description: 'Golden, crispy fries made fresh',
        price: 2.49,
        category: 'sides',
        available: true
      },
      {
        name: 'Shakes',
        description: 'Chocolate, Strawberry, or Vanilla made with real ice cream',
        price: 2.99,
        category: 'drinks',
        available: true
      }
    ];
    
    await MenuItem.insertMany(menuItems);
    
    res.json({ message: 'Database seeded successfully', items: menuItems });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed database', details: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

// Export for Vercel
module.exports = app;