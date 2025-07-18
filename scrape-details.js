const observer = new MutationObserver((mutations, obs) => {
  const brandElement = document.querySelector('.detail-item_brand span[itemprop="name"]');
  const controlsElement = document.querySelector('#product-detail-contols-cart');
  const detailsElement = document.querySelector('.product-additional-details_container');
  const reviewElement = document.querySelector('.review-overview-rating');

  if (brandElement && controlsElement && detailsElement) {
    try {
      const productData = {};

      const getText = (selector, parent = document) => {
        try {
          return parent.querySelector(selector)?.textContent.replace(/\s+/g, ' ').trim() || null;
        } catch (e) {
          console.error(`Error getting text for selector: ${selector}`, e);
          return null;
        }
      };

      const getAttribute = (selector, attribute, parent = document) => {
        try {
          return parent.querySelector(selector)?.getAttribute(attribute) || null;
        } catch (e) {
          console.error(`Error getting attribute for selector: ${selector}`, e);
          return null;
        }
      };
      
      productData.brand = getText('.detail-item_brand span[itemprop="name"]');
      productData.title = getText('.detail-item_title');
      productData.imageUrl = getAttribute('.product-detail-slick-item img', 'src');
      productData.description = getText('p[itemprop="description"]');
      
      try {
          const awardElement = document.querySelector('div[ng-if*="awardwinner"] p');
          if (awardElement) {
              productData.awards = awardElement.innerText.replace("Awards Won", "").replace(/\s+/g, ' ').trim();
          }
      } catch (e) {
          console.error('Error getting awards', e);
      }

      try {
          const priceTitle = document.querySelector('h1.product-details_controls_title');
          if (priceTitle) {
              const fullPriceText = Array.from(priceTitle.childNodes)
                  .map(node => node.textContent.trim())
                  .join('');
              productData.mainPrice = fullPriceText;
          }
      } catch(e) {
          console.error('Error scraping main price', e);
      }
      
      try {
        productData.packagingOptions = [];
        document.querySelectorAll('.trolley-controls_volume').forEach(optionNode => {
          const type = getText('.trolley-controls_volume_title', optionNode);
          const priceDollars = getText('.trolley-controls_volume_price--dollars', optionNode);
          const priceSign = getText('.trolley-controls_volume_price--dollarsign', optionNode);

          if (type && priceDollars) {
            productData.packagingOptions.push({
              type: type.replace(/\s+/g, ' ').trim(),
              price: `${priceSign || ''}${priceDollars}`
            });
          }
        });
      } catch(e) {
          console.error('Error scraping packaging options', e);
      }

      try {
        document.querySelectorAll('.list--details_item').forEach(item => {
            const keyRaw = getText('.list-details_header', item);
            if (keyRaw) {
                const key = keyRaw.replace(/\s/g, '');
                const value = getText('.list-details_info', item);
                if (key && value && key.toLowerCase() !== 'brand') { // Exclude redundant brand info
                    productData[key] = value;
                }
            }
        });
      } catch(e) {
        console.error('Error getting additional details', e);
      }
      
      if(reviewElement) {
          try {
            productData.overallRating = getText('.star-rating .sr-only')?.replace('Average rating:', '').trim();
            productData.reviewSummary = getText('.review-overview-summary');
          } catch(e) {
              console.error('Error getting review details', e);
          }
      }

      chrome.runtime.sendMessage({ action: "scraped_data", data: productData });
    } catch (error) {
      console.error("Error scraping product details:", error);
      chrome.runtime.sendMessage({ action: "scraping_error", error: error.message });
    } finally {
      obs.disconnect();
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
}); 