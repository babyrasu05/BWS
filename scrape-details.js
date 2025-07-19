
const observer = new MutationObserver(async (mutations, obs) => {
  const brandElement = document.querySelector('.detail-item_brand span[itemprop="name"]');
  const controlsElement = document.querySelector('#product-detail-contols-cart');
  const detailsElement = document.querySelector('.product-additional-details_container');

  if (brandElement && controlsElement && detailsElement) {
    try {
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

      // Get basic product info
      const brand = getText('.detail-item_brand span[itemprop="name"]');
      const title = getText('.detail-item_title');
      const fullName = brand && title ? `${brand} ${title}` : (title || brand);
      const imageUrl = getAttribute('.product-detail-slick-item img', 'src');
      const description = getText('p[itemprop="description"]');
      
      // Get product URL
      const productUrl = window.location.href;
      
      // Get product ID from URL or other source
      const productId = productUrl.match(/\/product\/(\d+)\//)?.[1] || '';

      // Get awards
      let awards = '';
      try {
        const awardElement = document.querySelector('div[ng-if*="awardwinner"] p');
        if (awardElement) {
          awards = awardElement.innerText.replace("Awards Won", "").replace(/\s+/g, ' ').trim();
        }
      } catch (e) {
        console.error('Error getting awards', e);
      }

      // Get additional details
      const additionalDetails = {};
      try {
        document.querySelectorAll('.list--details_item').forEach(item => {
          const keyRaw = getText('.list-details_header', item);
          if (keyRaw) {
            const key = keyRaw.replace(/\s/g, '');
            const value = getText('.list-details_info', item);
            if (key && value && key.toLowerCase() !== 'brand') {
              additionalDetails[key] = value;
            }
          }
        });
      } catch(e) {
        console.error('Error getting additional details', e);
      }

      // Get review info
      let overallRating = '';
      let reviewCount = '';
      try {
        // Try to get rating from product tile rating first
        const productRatingElement = document.querySelector('.productTile_rating .star-rating .sr-only span.ng-binding');
        if (productRatingElement) {
          overallRating = productRatingElement.textContent.trim();
        }
        
        // If not found, try alternative selectors
        if (!overallRating) {
          const srOnlyElements = document.querySelectorAll('.sr-only span.ng-binding');
          for (let element of srOnlyElements) {
            const parentText = element.parentElement?.textContent || '';
            if (parentText.includes('Average rating:')) {
              overallRating = element.textContent.trim();
              break;
            }
          }
        }
        
        // Get review count directly from rating_count element
        const reviewCountElement = document.querySelector('.rating_count.ng-binding');
        if (reviewCountElement) {
          const countText = reviewCountElement.textContent.trim();
          // Check if it's in parentheses format like "(27)" or just plain number "27"
          const countMatch = countText.match(/\((\d+)\)|^(\d+)$/);
          reviewCount = countMatch ? (countMatch[1] || countMatch[2]) : countText;
        }
        
        // Try to get from review overview if product tile didn't work
        if (!overallRating || !reviewCount) {
          const reviewElement = document.querySelector('.review-overview-rating');
          if (reviewElement) {
            if (!overallRating) {
              const reviewRatingElement = reviewElement.querySelector('.star-rating .sr-only span.ng-binding');
              if (reviewRatingElement) {
                overallRating = reviewRatingElement.textContent.trim();
              }
            }
            if (!reviewCount) {
              const reviewSummary = getText('.review-overview-summary') || '';
              const reviewMatch = reviewSummary.match(/\((\d+)\/\d+\)/);
              reviewCount = reviewMatch ? reviewMatch[1] : '';
            }
          }
        }
      } catch(e) {
        console.error('Error getting review details', e);
      }

      // Get packaging options with pricing - ENHANCED WITH BETTER ERROR HANDLING
      const packagingOptions = [];
      try {
        // Wait a bit for Angular to render
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const volumeElements = document.querySelectorAll('.trolley-controls_volume');
        console.log(`Found ${volumeElements.length} packaging options`);
        
        // If no volume elements found, try alternative selectors
        if (volumeElements.length === 0) {
          console.log('No volume elements found, trying alternative selectors...');
          const altElements = document.querySelectorAll('[ng-repeat*="product in productCollection.Products"]');
          console.log(`Found ${altElements.length} alternative elements`);
        }
        
        volumeElements.forEach((optionNode, index) => {
          try {
            console.log(`Processing packaging option ${index + 1}`);
            console.log('Option node HTML:', optionNode.outerHTML.substring(0, 500));
            
            // Try multiple selectors for bundle/title
            let bundle = getText('.trolley-controls_volume_title', optionNode) ||
                        getText('.volume_title', optionNode) ||
                        getText('[ng-bind*="title"]', optionNode) ||
                        getText('[ng-bind*="name"]', optionNode);
            
            // Try multiple selectors for price dollars
            let priceDollars = getText('.trolley-controls_volume_price--dollars', optionNode) ||
                              getText('.price--dollars', optionNode) ||
                              getText('[ng-bind*="dollars"]', optionNode) ||
                              getText('.price-dollars', optionNode);
                              
            // Try multiple selectors for price cents
            let priceCents = getText('.trolley-controls_volume_price--cents', optionNode) ||
                            getText('.price--cents', optionNode) ||
                            getText('[ng-bind*="cents"]', optionNode) ||
                            getText('.price-cents', optionNode);
                            
            // Try multiple selectors for price sign
            let priceSign = getText('.trolley-controls_volume_price--dollarsign', optionNode) ||
                           getText('.price--dollarsign', optionNode) ||
                           getText('.dollarsign', optionNode) || '$';
            
            console.log(`Raw values - Bundle: "${bundle}", Dollars: "${priceDollars}", Cents: "${priceCents}", Sign: "${priceSign}"`);
            
            // If we still don't have bundle or price, try getting all text content
            if (!bundle || !priceDollars) {
              console.log('Trying to extract from all text content...');
              const allText = optionNode.textContent.trim();
              console.log('All text content:', allText);
              
              // Try to find price patterns in the text
              const priceMatch = allText.match(/\$(\d+)(?:\.(\d{2}))?/);
              if (priceMatch && !priceDollars) {
                priceDollars = priceMatch[1];
                priceCents = priceMatch[2] || '00';
                priceSign = '$';
                console.log('Extracted price from text:', priceDollars, priceCents);
              }
              
              // Try to find bundle info from text
              if (!bundle) {
                const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                for (let line of lines) {
                  if (line.includes('ml') || line.includes('Pack') || line.includes('Can') || line.includes('Bottle') || line.includes('Case')) {
                    bundle = line;
                    console.log('Extracted bundle from text:', bundle);
                    break;
                  }
                }
              }
            }
            
            if (bundle && priceDollars) {
              // Construct full price including cents if available
              let fullPrice = priceDollars;
              if (priceCents && priceCents !== '00') {
                fullPrice = `${priceDollars}.${priceCents}`;
              } else {
                fullPrice = `${priceDollars}.00`;
              }
              const nonMemberPrice = `${priceSign || '$'}${fullPrice}`;
              
              console.log(`Successfully extracted - Bundle: ${bundle}, Price: ${nonMemberPrice}`);
              
              // Check for promo pricing from volume controls
              let promoPrice = '';
            try {
              const promoElement = optionNode.querySelector('.trolley-controls_volume_promo');
              if (promoElement) {
                promoPrice = getText('.trolley-controls_volume_promo', optionNode) || '';
              }
            } catch (e) {
              console.error('Error getting promo price', e);
            }

            // Check for promotional badge pricing (3 for $22 type offers)
            if (!promoPrice) {
              try {
                const promoBadge = document.querySelector('percentage-off-badge');
                if (promoBadge) {
                  const topText = getText('.badge_top-text', promoBadge) || '';
                  const subtitleText = getText('.badge_subtitle', promoBadge) || '';
                  const bottomText = getText('.badge_bottom-text', promoBadge) || '';
                  
                  // Combine all parts to form the complete promo text
                  let promoParts = [];
                  if (topText) promoParts.push(topText);
                  if (subtitleText) promoParts.push(subtitleText);
                  if (bottomText) promoParts.push(bottomText);
                  
                  if (promoParts.length > 0) {
                    promoPrice = promoParts.join(' ').trim();
                  }
                }
              } catch (e) {
                console.error('Error getting promotional badge price', e);
              }
            }

            // Check for savings badge and adjust pricing accordingly
            let adjustedNonMemberPrice = nonMemberPrice;
            let discountPrice = '';
            let memberPrice = '';
            let savingsAmount = '';
            
            try {
              const savingsBadge = document.querySelector('savings-badge .badge_subtitle');
              if (savingsBadge) {
                // Get the full text content and parse it properly
                const fullText = savingsBadge.textContent.trim();
                
                // Remove the dollar sign and extract the number
                const numberMatch = fullText.replace('$', '').match(/(\d+)(\d{2})?/);
                
                if (numberMatch) {
                  const allDigits = numberMatch[0];
                  
                  if (allDigits.length <= 2) {
                    // If 1-2 digits, treat as whole dollars with .00 cents
                    savingsAmount = `${allDigits}.00`;
                  } else if (allDigits.length === 3) {
                    // If 3 digits, first digit(s) are dollars, last 2 are cents
                    const dollars = allDigits.substring(0, 1);
                    const cents = allDigits.substring(1);
                    savingsAmount = `${dollars}.${cents}`;
                  } else if (allDigits.length >= 4) {
                    // If 4+ digits, last 2 are cents, rest are dollars
                    const dollars = allDigits.substring(0, allDigits.length - 2);
                    const cents = allDigits.substring(allDigits.length - 2);
                    savingsAmount = `${dollars}.${cents}`;
                  }
                  
                  if (savingsAmount) {
                    const currentPrice = parseFloat(fullPrice);
                    const savings = parseFloat(savingsAmount);
                    
                    if (!isNaN(currentPrice) && !isNaN(savings)) {
                      // Current price becomes discount price
                      discountPrice = nonMemberPrice;
                      // Non-member price = current price + savings
                      adjustedNonMemberPrice = `${priceSign || ''}${(currentPrice + savings).toFixed(2)}`;
                    }
                  }
                }
              }
            } catch (e) {
              console.error('Error getting savings badge', e);
            }

            // Check for member/discount pricing (if not already set by savings badge)
            try {
              const memberElement = optionNode.querySelector('.trolley-controls_volume_member-price');
              if (memberElement) {
                memberPrice = getText('.trolley-controls_volume_member-price', optionNode) || '';
              }
              
              // Only check for discount element if not already set by savings badge
              if (!discountPrice) {
                const discountElement = optionNode.querySelector('.trolley-controls_volume_discount-price');
                if (discountElement) {
                  discountPrice = getText('.trolley-controls_volume_discount-price', optionNode) || '';
                }
              }
            } catch (e) {
              console.error('Error getting member/discount price', e);
            }

            // Check stock status
              let stock = '';
              try {
                const stockElement = optionNode.querySelector('.stock-status');
                if (stockElement) {
                  stock = getText('.stock-status', optionNode) || '';
                }
                
                // Try alternative stock selectors
                if (!stock) {
                  stock = getText('[ng-bind*="stock"]', optionNode) ||
                         getText('.availability', optionNode) ||
                         getText('.stock', optionNode) || '';
                }
              } catch (e) {
                console.error('Error getting stock status', e);
              }

              packagingOptions.push({
                bundle: bundle.replace(/\s+/g, ' ').trim(),
                stock: stock,
                nonMemberPrice: adjustedNonMemberPrice,
                promoPrice: promoPrice,
                discountPrice: discountPrice,
                memberPrice: memberPrice
              });
              
              console.log('Added packaging option:', {
                bundle: bundle.replace(/\s+/g, ' ').trim(),
                stock: stock,
                nonMemberPrice: adjustedNonMemberPrice,
                promoPrice: promoPrice,
                discountPrice: discountPrice,
                memberPrice: memberPrice
              });
            } else {
              console.log('Skipping option - missing bundle or price data');
              console.log('Bundle:', bundle, 'PriceDollars:', priceDollars);
            }
          } catch (optionError) {
            console.error(`Error processing packaging option ${index + 1}:`, optionError);
            console.log('Option node that failed:', optionNode);
          }
        });
        
        console.log(`Total packaging options collected: ${packagingOptions.length}`);
        
        // If no packaging options found, try fallback method
        if (packagingOptions.length === 0) {
          console.log('No packaging options found, trying fallback extraction...');
          try {
            // Look for any price elements on the page
            const priceElements = document.querySelectorAll('[class*="price"], [ng-bind*="price"], [ng-bind*="dollars"]');
            console.log(`Found ${priceElements.length} potential price elements`);
            
            priceElements.forEach((el, i) => {
              console.log(`Price element ${i}:`, el.textContent, el.className);
            });
            
            // Try to extract from the main product price if no options found
            const mainPrice = getText('.product-price .price') || 
                             getText('[ng-bind*="currentPrice"]') ||
                             getText('.current-price');
                             
            if (mainPrice) {
              console.log('Found main price, using as single option:', mainPrice);
              packagingOptions.push({
                bundle: getText('.detail-item_title') || 'Single Item',
                stock: 'Available',
                nonMemberPrice: mainPrice,
                promoPrice: '',
                discountPrice: '',
                memberPrice: ''
              });
            }
          } catch (fallbackError) {
            console.error('Fallback extraction failed:', fallbackError);
          }
        }
      } catch(e) {
        console.error('Error scraping packaging options', e);
      }

      // Create the product data object
      const productData = {
        productId: productId,
        productUrl: productUrl,
        imageUrl: imageUrl,
        name: fullName,
        brand: brand,
        style: additionalDetails.BeerType || additionalDetails.LiquorStyle || '',
        abv: additionalDetails['Alcohol%'] || '',
        description: description,
        rating: overallRating,
        review: reviewCount,
        ibu: additionalDetails.IBU || '',
        additionalDetails: additionalDetails,
        packagingOptions: packagingOptions
      };

      console.log('Final product data:', productData);
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
