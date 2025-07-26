const vision = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');

const client = new vision.ImageAnnotatorClient();

const imagesDir = path.join(__dirname, 'attached_assets');
const portfolioData = [];

async function classifyImages() {
  const files = fs.readdirSync(imagesDir).filter(file =>
    /\.(jpe?g|png)$/i.test(file)
  );

  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    const [result] = await client.labelDetection(filePath);
    const labels = result.labelAnnotations.map(label => label.description.toLowerCase());
    let categoria = 'outro';
    if (labels.includes('kitchen')) categoria = 'cozinha';
    else if (labels.includes('bathroom')) categoria = 'banheiro';
    else if (labels.includes('closet') || labels.includes('wardrobe')) categoria = 'closet';
    else if (labels.includes('living room') || labels.includes('sofa')) categoria = 'sala';

    portfolioData.push({ image: file, categoria, labels });
    console.log(`${file}: ${categoria} (${labels.join(', ')})`);
  }

  // Salva o resultado em um arquivo JSON
  fs.writeFileSync('portfolio-classificado.json', JSON.stringify(portfolioData, null, 2), 'utf-8');
  console.log('Classificação concluída! Veja o arquivo portfolio-classificado.json');
}

classifyImages(); 