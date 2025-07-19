let scrapedData = [];
let navigationInProgress = false;

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    if (tab.url && tab.url.includes('https://bws.com.au/beer/craft-beer')) {
      chrome.storage.local.remove(['links', 'currentLinkIndex', 'navigationTabId', 'scrapedData']);
      scrapedData = [];
      navigationInProgress = false;
      chrome.action.setPopup({ tabId: tabId, popup: 'popup.html' });
    } else if (tab.url && tab.url.includes('https://bws.com.au/product/')) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['scrape-details.js']
      });
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "navigate_links") {
    if (navigationInProgress) {
      console.log("Navigation already in progress.");
      return;
    }
    
    scrapedData = [];
    navigationInProgress = true;
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.storage.local.get('links', (data) => {
          if (data.links && data.links.length > 0) {
            chrome.storage.local.set({ 
              'currentLinkIndex': 0, 
              'navigationTabId': tabs[0].id 
            }, () => {
              navigateToNextLink();
            });
          } else {
            navigationInProgress = false; 
          }
        });
      } else {
        navigationInProgress = false;
      }
    });
  } else if (request.action === "scraped_data") {
    const isDuplicate = scrapedData.some(existing => 
      existing.productId === request.data.productId || 
      existing.productUrl === request.data.productUrl
    );
    
    if (!isDuplicate) {
      scrapedData.push(request.data);
    }
    
    chrome.storage.local.set({ scrapedData: scrapedData }, () => {
      chrome.runtime.sendMessage({ action: "data_updated" });
      
      chrome.storage.local.get(['currentLinkIndex', 'navigationTabId'], (data) => {
        if (data.currentLinkIndex !== undefined && data.navigationTabId) {
          const nextIndex = data.currentLinkIndex + 1;
          chrome.storage.local.set({ 'currentLinkIndex': nextIndex }, () => {
            setTimeout(navigateToNextLink, 2000); 
          });
        }
      });
    });
  } else if (request.action === "scraping_error") {
    console.error("Scraping error on page, continuing to next link.");
    
    chrome.storage.local.get(['currentLinkIndex', 'navigationTabId'], (data) => {
      if (data.currentLinkIndex !== undefined && data.navigationTabId) {
        const nextIndex = data.currentLinkIndex + 1;
        chrome.storage.local.set({ 'currentLinkIndex': nextIndex }, () => {
          setTimeout(navigateToNextLink, 2000);
        });
      }
    });
  }
});

function navigateToNextLink() {
  chrome.storage.local.get(['links', 'currentLinkIndex', 'navigationTabId'], (data) => {
    if (data.links && data.currentLinkIndex !== undefined && data.navigationTabId) {
      const currentIndex = data.currentLinkIndex;
      const links = data.links;
      
      if (currentIndex < links.length) {
        const nextLink = `https://bws.com.au${links[currentIndex]}`;
        chrome.tabs.update(data.navigationTabId, { url: nextLink });
      } else {
        console.log("Navigation complete.");
        navigationInProgress = false;
        chrome.storage.local.remove(['currentLinkIndex', 'navigationTabId']);
      }
    } else {
      navigationInProgress = false;
    }
  });
}
