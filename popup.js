
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
    const csvRows = [];
    const headers = [
      'Product ID', 'Product URL', 'Image URL', 'Name', 'Brand', 'Style', 'ABV', 
      'Description', 'Rating', 'Review', 'Bundle', 'Stock', 'Non-Member Price', 
      'Promo Price', 'Discount Price', 'Member Price'
    ];
    
    csvRows.push(headers.join(','));
    
    data.forEach(product => {
      if (product.packagingOptions && product.packagingOptions.length > 0) {
        product.packagingOptions.forEach(option => {
          const row = [
            escapeCSV(product.productId || ''),
            escapeCSV(product.productUrl || ''),
            escapeCSV(product.imageUrl || ''),
            escapeCSV(product.name || ''),
            escapeCSV(product.brand || ''),
            escapeCSV(product.style || ''),
            escapeCSV(product.abv || ''),
            escapeCSV(product.description || ''),
            escapeCSV(product.rating || ''),
            escapeCSV(product.review || ''),
            escapeCSV(option.bundle || ''),
            escapeCSV(option.stock || ''),
            escapeCSV(option.nonMemberPrice || ''),
            escapeCSV(option.promoPrice || ''),
            escapeCSV(option.discountPrice || ''),
            escapeCSV(option.memberPrice || '')
          ];
          csvRows.push(row.join(','));
        });
      } else {
        const row = [
          escapeCSV(product.productId || ''),
          escapeCSV(product.productUrl || ''),
          escapeCSV(product.imageUrl || ''),
          escapeCSV(product.name || ''),
          escapeCSV(product.brand || ''),
          escapeCSV(product.style || ''),
          escapeCSV(product.abv || ''),
          escapeCSV(product.description || ''),
          escapeCSV(product.rating || ''),
          escapeCSV(product.review || ''),
          '', '', '', '', '', ''
        ];
        csvRows.push(row.join(','));
      }
    });
    
    return csvRows.join('\n');
  }

  function escapeCSV(str) {
    if (str === null || str === undefined) return '';
    str = String(str);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
});
