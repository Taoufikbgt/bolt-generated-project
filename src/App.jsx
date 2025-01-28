import React, { useState, useEffect } from 'react';
import localforage from 'localforage';
import Papa from 'papaparse';
import { useColorThief } from 'color-thief-react';

function App() {
  const [language, setLanguage] = useState('en');
  const [database, setDatabase] = useState(null);
  const [images, setImages] = useState({});
  const [labels, setLabels] = useState({});
  const [mappings, setMappings] = useState({});
  const [productSheets, setProductSheets] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize localForage database
    localforage.config({
      driver: localforage.INDEXEDDB,
      name: 'jakamen',
      storeName: 'product_sheets',
    });
  }, []);

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleDatabaseUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setDatabase(results.data);
      },
      error: (err) => {
        console.error('Error parsing database file:', err);
        setError('Error parsing database file.');
      },
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = {};
    files.forEach((file) => {
      const productId = file.name.split('_')[0];
      newImages[productId] = URL.createObjectURL(file);
    });
    setImages((prevImages) => ({ ...prevImages, ...newImages }));
  };

  const handleLabelUpload = (e) => {
    const files = Array.from(e.target.files);
    const newLabels = {};
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const labelText = event.target.result;
        const productIdMatch = labelText.match(/JK(\w+)/);
        const productId = productIdMatch ? `JK${productIdMatch[1]}` : null;
        if (productId) {
          const colorMatch = labelText.match(/Renk\/Color:\s*([\w\s]+)/);
          const sizeMatch = labelText.match(/Beden\/Size:\s*([\w\s\/]+)/);
          const dropMatch = labelText.match(/Drop:\s*([\w\s]+)/);
          const kalipMatch = labelText.match(/Kalip:\s*([\w\s]+)/);
          const compositionMatch = labelText.match(/Material Composition:\s*([\w\s%]+)/);
          const careMatch = labelText.match(/Care Instructions:\s*(.+)/);
          const barcodeMatch = labelText.match(/Barcode:\s*(\d+)/);

          newLabels[productId] = {
            color: colorMatch ? colorMatch[1].trim() : 'N/A',
            size: sizeMatch ? sizeMatch[1].trim() : 'N/A',
            drop: dropMatch ? dropMatch[1].trim() : 'N/A',
            kalip: kalipMatch ? kalipMatch[1].trim() : 'N/A',
            composition: compositionMatch ? compositionMatch[1].trim() : 'N/A',
            care: careMatch ? careMatch[1].trim() : 'N/A',
            barcode: barcodeMatch ? barcodeMatch[1].trim() : 'N/A',
            fullText: labelText,
          };
        } else {
          console.warn('Could not extract product ID from label:', labelText);
        }
        setLabels((prevLabels) => ({ ...prevLabels, ...newLabels }));
      };
      reader.readAsText(file);
    });
  };

  const handleAutoMap = () => {
    if (!database || !Object.keys(labels).length) {
      setError('Please upload database and labels first.');
      return;
    }

    const initialMappings = {};
    database.forEach((product) => {
      const productId = product.id;
      if (labels[productId]) {
        initialMappings[productId] = {
          ...product,
          ...labels[productId],
        };
      } else {
        initialMappings[productId] = { ...product };
      }
    });
    setMappings(initialMappings);
  };

  const handleMappingChange = (productId, field, value) => {
    setMappings((prevMappings) => ({
      ...prevMappings,
      [productId]: {
        ...prevMappings[productId],
        [field]: value,
      },
    }));
  };

  const handleGenerateProductSheets = async () => {
    if (!mappings || Object.keys(mappings).length === 0) {
      setError('Please map the data first.');
      return;
    }

    setLoading(true);
    const newProductSheets = {};
    for (const productId in mappings) {
      const productData = mappings[productId];
      const imageUrl = images[productId] || '';
      // Placeholder for Google Vision API
      const imageAnalysis = await analyzeImage(imageUrl);
      const dominantColor = imageAnalysis?.dominantColor || await getDominantColor(imageUrl);
      // Placeholder for DeepSeek API
      const description = await generateDescriptionWithDeepSeek(productData, language, dominantColor);
      newProductSheets[productId] = {
        ...productData,
        imageUrl,
        description,
      };
      try {
        await localforage.setItem(productId, newProductSheets[productId]);
      } catch (err) {
        console.error('Error saving product sheet to database:', err);
        setError('Error saving product sheet to database.');
      }
    }
    setProductSheets(newProductSheets);
    setLoading(false);
  };

  const analyzeImage = async (imageUrl) => {
    // Placeholder for Google Vision API
    console.log('Placeholder for Google Vision API call', imageUrl);
    return { dominantColor: null };
  };

  const getDominantColor = async (imageUrl) => {
    if (!imageUrl) return 'N/A';
    try {
      const { data } = await useColorThief(imageUrl);
      if (data && data.length === 3) {
        return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
      }
      return 'N/A';
    } catch (err) {
      console.error('Error getting dominant color:', err);
      return 'N/A';
    }
  };

  const generateDescriptionWithDeepSeek = async (productData, language, dominantColor) => {
    // Placeholder for DeepSeek API
    console.log('Placeholder for DeepSeek API call', productData, language, dominantColor);
    return generateDescription(productData, language, dominantColor);
  };

  const generateDescription = (productData, language, dominantColor) => {
    const { name, description, color, size, composition, care, drop, kalip } = productData;
    const colorText = language === 'tr' ? `Renk: ${color}` : `Color: ${color}`;
    const sizeText = language === 'tr' ? `Beden: ${size}` : `Size: ${size}`;
    const compositionText = language === 'tr' ? `Materyal: ${composition}` : `Material: ${composition}`;
    const careText = language === 'tr' ? `Bakım: ${care}` : `Care: ${care}`;
    const dropText = language === 'tr' ? `Drop: ${drop}` : `Drop: ${drop}`;
    const kalipText = language === 'tr' ? `Kalip: ${kalip}` : `Kalip: ${kalip}`;
    const dominantColorText = language === 'tr' ? `Ana Renk: ${dominantColor}` : `Dominant Color: ${dominantColor}`;

    if (language === 'tr') {
      return `
        ${name} - ${description}
        <br/>
        ${colorText}
        <br/>
        ${sizeText}
        <br/>
        ${compositionText}
        <br/>
        ${careText}
        <br/>
        ${dropText}
        <br/>
        ${kalipText}
        <br/>
        ${dominantColorText}
      `;
    } else {
      return `
        ${name} - ${description}
        <br/>
        ${colorText}
        <br/>
        ${sizeText}
        <br/>
        ${compositionText}
        <br/>
        ${careText}
        <br/>
        ${dropText}
        <br/>
        ${kalipText}
        <br/>
        ${dominantColorText}
      `;
    }
  };

  const handleReviewProductSheet = (productId) => {
    setSelectedProduct(productId);
  };

  const handleModifyProductSheet = (productId, field, value) => {
    setProductSheets((prevSheets) => ({
      ...prevSheets,
      [productId]: {
        ...prevSheets[productId],
        [field]: value,
      },
    }));
  };

  const handleRegenerateProductSheet = async (productId) => {
    setLoading(true);
    const productData = mappings[productId];
    const imageUrl = images[productId] || '';
    // Placeholder for Google Vision API
    const imageAnalysis = await analyzeImage(imageUrl);
    const dominantColor = imageAnalysis?.dominantColor || await getDominantColor(imageUrl);
    // Placeholder for DeepSeek API
    const description = await generateDescriptionWithDeepSeek(productData, language, dominantColor);
    const updatedProductSheet = {
      ...productData,
      imageUrl,
      description,
    };
    setProductSheets((prevSheets) => ({
      ...prevSheets,
      [productId]: updatedProductSheet,
    }));
    try {
      await localforage.setItem(productId, updatedProductSheet);
    } catch (err) {
      console.error('Error saving product sheet to database:', err);
      setError('Error saving product sheet to database.');
    }
    setLoading(false);
  };

  const handleExport = async (format) => {
    if (!productSheets || Object.keys(productSheets).length === 0) {
      setError('No product sheets to export.');
      return;
    }

    let exportData = [];
    if (format === 'json') {
      exportData = JSON.stringify(productSheets, null, 2);
      downloadFile(exportData, 'product_sheets.json', 'application/json');
    } else if (format === 'csv') {
      const csv = Papa.unparse(Object.values(productSheets));
      downloadFile(csv, 'product_sheets.csv', 'text/csv');
    } else if (format === 'google-sheets') {
      const googleSheetsData = Object.values(productSheets).map(sheet => {
        return Object.values(sheet);
      });
      const googleSheetsCsv = Papa.unparse(googleSheetsData);
      downloadFile(googleSheetsCsv, 'product_sheets.csv', 'text/csv');
    }
  };

  const downloadFile = (data, filename, type) => {
    const file = new Blob([data], { type: type });
    const a = document.createElement('a');
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  const handleLoadProductSheets = async () => {
    setLoading(true);
    try {
      const loadedSheets = {};
      await localforage.iterate((value, key) => {
        loadedSheets[key] = value;
      });
      setProductSheets(loadedSheets);
    } catch (err) {
      console.error('Error loading product sheets from database:', err);
      setError('Error loading product sheets from database.');
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Jakamen Product Sheet Generator</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="upload-section">
        <h2>Initial Setup</h2>
        <label>
          Select Language:
          <select value={language} onChange={handleLanguageChange}>
            <option value="en">English</option>
            <option value="tr">Turkish</option>
          </select>
        </label>
        <br />
        <label>
          Upload Product Database (CSV/XLSX):
          <input type="file" accept=".csv, .xlsx" onChange={handleDatabaseUpload} />
        </label>
        <br />
        <label>
          Upload Product Images:
          <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
        </label>
        <br />
        <label>
          Upload Product Labels:
          <input type="file" accept=".txt" multiple onChange={handleLabelUpload} />
        </label>
      </div>

      <div className="mapping-section">
        <h2>Data Mapping</h2>
        <button onClick={handleAutoMap}>Auto Map Data</button>
        {mappings && Object.keys(mappings).length > 0 && (
          <table className="mapping-table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Color</th>
                <th>Size</th>
                <th>Drop</th>
                <th>Kalip</th>
                <th>Composition</th>
                <th>Care</th>
                <th>Barcode</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(mappings).map(([productId, data]) => (
                <tr key={productId}>
                  <td>{productId}</td>
                  <td>
                    <input
                      type="text"
                      value={data.name || ''}
                      onChange={(e) => handleMappingChange(productId, 'name', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={data.description || ''}
                      onChange={(e) => handleMappingChange(productId, 'description', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={data.color || ''}
                      onChange={(e) => handleMappingChange(productId, 'color', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={data.size || ''}
                      onChange={(e) => handleMappingChange(productId, 'size', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={data.drop || ''}
                      onChange={(e) => handleMappingChange(productId, 'drop', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={data.kalip || ''}
                      onChange={(e) => handleMappingChange(productId, 'kalip', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={data.composition || ''}
                      onChange={(e) => handleMappingChange(productId, 'composition', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={data.care || ''}
                      onChange={(e) => handleMappingChange(productId, 'care', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={data.barcode || ''}
                      onChange={(e) => handleMappingChange(productId, 'barcode', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="product-sheet-section">
        <h2>Product Sheet Generation</h2>
        <button onClick={handleGenerateProductSheets} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Product Sheets'}
        </button>
        <button onClick={handleLoadProductSheets} disabled={loading}>
          {loading ? 'Loading...' : 'Load Product Sheets'}
        </button>
        {productSheets && Object.keys(productSheets).length > 0 && (
          <div>
            {Object.entries(productSheets).map(([productId, sheet]) => (
              <div key={productId} className="product-sheet-preview">
                <h3>Product ID: {productId}</h3>
                {sheet.imageUrl && <img src={sheet.imageUrl} alt={sheet.name} />}
                <p><strong>Name:</strong> {sheet.name}</p>
                <p><strong>Description:</strong> {sheet.description}</p>
                <p><strong>Color:</strong> {sheet.color}</p>
                <p><strong>Size:</strong> {sheet.size}</p>
                <p><strong>Drop:</strong> {sheet.drop}</p>
                <p><strong>Kalip:</strong> {sheet.kalip}</p>
                <p><strong>Composition:</strong> {sheet.composition}</p>
                <p><strong>Care:</strong> {sheet.care}</p>
                <p><strong>Barcode:</strong> {sheet.barcode}</p>
                <div dangerouslySetInnerHTML={{ __html: sheet.description }} />
                <div className="button-group">
                  <button onClick={() => handleReviewProductSheet(productId)}>Review</button>
                  <button onClick={() => handleRegenerateProductSheet(productId)}>Regenerate</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProduct && productSheets[selectedProduct] && (
        <div className="product-sheet-section">
          <h2>Review/Modify Product Sheet</h2>
          <div className="product-sheet-preview">
            <h3>Product ID: {selectedProduct}</h3>
            {productSheets[selectedProduct].imageUrl && (
              <img src={productSheets[selectedProduct].imageUrl} alt={productSheets[selectedProduct].name} />
            )}
            <label>
              Name:
              <input
                type="text"
                value={productSheets[selectedProduct].name || ''}
                onChange={(e) => handleModifyProductSheet(selectedProduct, 'name', e.target.value)}
              />
            </label>
            <label>
              Description:
              <input
                type="text"
                value={productSheets[selectedProduct].description || ''}
                onChange={(e) => handleModifyProductSheet(selectedProduct, 'description', e.target.value)}
              />
            </label>
            <label>
              Color:
              <input
                type="text"
                value={productSheets[selectedProduct].color || ''}
                onChange={(e) => handleModifyProductSheet(selectedProduct, 'color', e.target.value)}
              />
            </label>
            <label>
              Size:
              <input
                type="text"
                value={productSheets[selectedProduct].size || ''}
                onChange={(e) => handleModifyProductSheet(selectedProduct, 'size', e.target.value)}
              />
            </label>
            <label>
              Drop:
              <input
                type="text"
                value={productSheets[selectedProduct].drop || ''}
                onChange={(e) => handleModifyProductSheet(selectedProduct, 'drop', e.target.value)}
              />
            </label>
            <label>
              Kalip:
              <input
                type="text"
                value={productSheets[selectedProduct].kalip || ''}
                onChange={(e) => handleModifyProductSheet(selectedProduct, 'kalip', e.target.value)}
              />
            </label>
            <label>
              Composition:
              <input
                type="text"
                value={productSheets[selectedProduct].composition || ''}
                onChange={(e) => handleModifyProductSheet(selectedProduct, 'composition', e.target.value)}
              />
            </label>
            <label>
              Care:
              <input
                type="text"
                value={productSheets[selectedProduct].care || ''}
                onChange={(e) => handleModifyProductSheet(selectedProduct, 'care', e.target.value)}
              />
            </label>
            <label>
              Barcode:
              <input
                type="text"
                value={productSheets[selectedProduct].barcode || ''}
                onChange={(e) => handleModifyProductSheet(selectedProduct, 'barcode', e.target.value)}
              />
            </label>
            <div dangerouslySetInnerHTML={{ __html: productSheets[selectedProduct].description }} />
          </div>
        </div>
      )}

      <div className="export-section">
        <h2>Export Product Sheets</h2>
        <button onClick={() => handleExport('json')}>Export as JSON</button>
        <button onClick={() => handleExport('csv')}>Export as CSV</button>
        <button onClick={() => handleExport('google-sheets')}>Export as Google Sheets</button>
      </div>
    </div>
  );
}

export default App;
