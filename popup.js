document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startScraping');
  const showLinksBtn = document.getElementById('showLinksBtn');
  const navigateLinksBtn = document.getElementById('navigateLinksBtn');
  const downloadCsvBtn = document.getElementById('downloadCsvBtn');
  const downloadJsonBtn = document.getElementById('downloadJsonBtn');
  const linksContainer = document.getElementById('linksContainer');

  startBtn.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "start"});
    });
  });

  showLinksBtn.addEventListener('click', () => {
    chrome.storage.local.get('links', (data) => {
      if (data.links) {
        linksContainer.innerHTML = '';
        data.links.forEach(link => {
          const a = document.createElement('a');
          a.href = `https://bws.com.au${link}`;
          a.textContent = `https://bws.com.au${link}`;
          a.target = '_blank';
          linksContainer.appendChild(a);
        });
        navigateLinksBtn.style.display = 'block';
      }
    });
  });

  navigateLinksBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({action: "navigate_links"});
  });

  downloadCsvBtn.addEventListener('click', () => {
    chrome.storage.local.get('scrapedData', (data) => {
      if (data.scrapedData) {
        downloadFile(convertToCSV(data.scrapedData), 'bws_data.csv', 'text/csv');
      }
    });
  });

  downloadJsonBtn.addEventListener('click', () => {
    chrome.storage.local.get('scrapedData', (data) => {
      if (data.scrapedData) {
        downloadFile(JSON.stringify(data.scrapedData, null, 2), 'bws_data.json', 'application/json');
      }
    });
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scraping_complete") {
      startBtn.style.display = 'none';
      showLinksBtn.style.display = 'block';
    }
    if (request.action === "data_updated") {
      downloadCsvBtn.style.display = 'block';
      downloadJsonBtn.style.display = 'block';
    }
  });

  function convertToCSV(data) {
    const allRows = [];
    const headerSet = new Set();

    data.forEach(product => {
      Object.keys(product).forEach(key => {
        if (key !== 'packagingOptions') {
          headerSet.add(key);
        }
      });
    });
    headerSet.add('packaging_type');
    headerSet.add('packaging_price');
    const headers = Array.from(headerSet);

    data.forEach(product => {
      const baseData = { ...product };
      delete baseData.packagingOptions;

      if (product.packagingOptions && product.packagingOptions.length > 0) {
        product.packagingOptions.forEach(option => {
          const row = {
            ...baseData,
            packaging_type: option.type,
            packaging_price: option.price
          };
          allRows.push(row);
        });
      } else {
        allRows.push(baseData);
      }
    });
    
    if (allRows.length === 0) return '';
    
    const csvRows = [
        headers.join(','),
        ...allRows.map(row => 
            headers.map(header => JSON.stringify(row[header] || '')).join(',')
        )
    ];
    return csvRows.join('\n');
  }

  function downloadFile(content, fileName, contentType) {
    const a = document.createElement("a");
    const file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }
}); 