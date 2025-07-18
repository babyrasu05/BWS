
# BWS Content Scraper

This Chrome extension is designed to scrape product information from the BWS (Beer Wine Spirits) website, specifically targeting the craft beer category.

## Features

- **Automated "Load More"**: Clicks the "Load More" button on the craft beer category page until all products are displayed.
- **Link Collection**: Gathers all unique product links from the fully loaded category page.
- **Sequential Navigation**: Automatically navigates to each collected product link to perform detailed scraping.
- **Detailed Product Scraping**: Extracts a wide range of data from each product page, including:
  - Brand and Title
  - Image URL and Description
  - Awards Won
  - Pricing Information
  - Packaging Options (e.g., 6 Pack, Carton)
  - Additional Details (e.g., Alcohol Volume, Standard Drinks, Beer Style)
  - Customer Reviews and Ratings
- **Data Export**: Allows the user to download all scraped data in both CSV and JSON formats.

## How to Use

1. **Navigate to the BWS Craft Beer Page**: Go to a [BWS craft beer listing page](https://bws.com.au/beer/craft-beer).
2. **Load All Products**: Click the extension icon and press the "LOAD MORE" button. The extension will start clicking the "Load More" button at the bottom of the page every 2 seconds until it's no longer visible.
3. **Show and Navigate Links**: Once loading is complete, the "Show Links" and "Navigate Links" buttons will appear.
    - Click "Show Links" to see a list of all the product URLs that were collected.
    - Click "Navigate Links" to begin the scraping process. The extension will open each link in the current tab.
4. **Scraping Process**: The extension will navigate to each product page one by one, with a 5-second delay between each navigation to allow the page to load fully. On each page, it scrapes the data.
5. **Download Data**: Once the navigation and scraping are complete (or at any point after some data has been scraped), the "Download CSV" and "Download JSON" buttons will become available. Click these to save the data to your computer.

## Files

- `manifest.json`: Configures the extension, defining permissions and specifying which scripts run on which BWS pages.
- `popup.html` & `popup.js`: Create and manage the user interface for the extension's popup, handling button clicks and displaying scraped links.
- `content.js`: Injected into the craft beer category page. It's responsible for the "load more" automation and collecting the initial product links.
- `scrape-details.js`: Injected into individual product pages. This script is responsible for extracting all the detailed product information.
- `background.js`: The service worker that orchestrates the entire process. It manages the navigation between product pages, stores the scraped data, and handles communication between different parts of the extension.
- `elements.html`: Appears to be a saved copy of a BWS product page, likely used for development and testing purposes. Not part of the active extension. 