// app.js

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

// Initialize express app
const app = express();
app.use(express.json());

// Product Model (mocked for demonstration)
const ProductModel = {
  insertProduct: async (productData) => {
    // Simulate inserting into a database (replace with real DB logic)
    return Promise.resolve({ id: 1, ...productData });
  }
};

// Scraper function using Cheerio
const scrapeProductData = async (asin) => {
  const url = `https://www.amazon.com/dp/${asin}`;
  
  try {
    // Fetch the page HTML
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
      }
    });

    // Load the HTML into Cheerio
    const $ = cheerio.load(html);

    // Function to extract text from a selector
    const getElementText = (selector) => $(selector).text().trim();
    
    // Extract product data
    const title = getElementText('#productTitle');
    const priceText = getElementText('.a-price .a-offscreen');
    const price = priceText ? parseFloat(priceText.replace(/[^0-9.-]+/g, '')) : null;
    const images = [];
    $('#altImages img').each((i, el) => {
      images.push($(el).attr('src'));
    });

    // Return product data object
    return {
      asin,
      title,
      price,
      images,
    };
  } catch (error) {
    console.error('Error fetching or scraping product data:', error);
    throw new Error('Failed to scrape product data');
  }
};

// Controller function to handle scraping and inserting product
const scrapeAndInsertProduct = async (req, res) => {
  try {
    const asin = req.body.asin; // Expect ASIN from request body
    const productData = await scrapeProductData(asin); // Scrape product details

    // Log the scraped product data to verify its structure
    console.log('Scraped Product Data:', productData);

    // Check if required fields are present
    if (!productData.title) {
      throw new Error("Product title is missing");
    }

    const insertedData = await ProductModel.insertProduct(productData); // Insert data into Supabase or your DB
    res.status(200).json({ message: 'Product inserted successfully', data: insertedData });
    console.log('Product added successfully:', insertedData);
  } catch (error) {
    // Create a single error response object
    const errorResponse = {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
    
    // Send the error response
    res.status(500).json({ error: errorResponse });
    console.error(error); // Log the full error for server-side debugging
  }
};

// Routes
app.post('/scrape-product', scrapeAndInsertProduct);

// Start the server
const port = process.env.PORT || 9001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

 