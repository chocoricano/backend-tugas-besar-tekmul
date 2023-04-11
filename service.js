import fs from 'fs';
import axios from 'axios';

let parameter = [
  'Flu',
  'Pilek',
  'Sakit Kepala',
  'Migren',
  'Sakit Perut',
  'Diare',
  'Batuk',
  'Asma',
  'Sakit Punggung',
  'Insomnia',
  'murah',
  'mahal',
];

const helloWorld = async () => {
  return 'Hello, World!';
};

const getKeywords = async (text) => {

  let words = text.split(' ');

  words = words.map((word) => {
    return word.replace(/[,|.]/g, '');
  });

  let keywords = [];
  parameter.forEach((keyword) => {
    words.forEach((word) => {
      if (word.toLowerCase() === keyword.toLowerCase()) {
        keywords.push(keyword);
      }
    });
  });
  console.log(keywords);
  return keywords;
};

const getProducts = async (searchTerm, page, perPage) => {
  const searchTermEncoded = encodeURIComponent(searchTerm);
  const url = `https://magneto.api.halodoc.com/api/v1/buy-medicine/products/search/${searchTermEncoded}?page=${page}&per_page=${perPage}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getProductsByKeyword = async (keywords, page = 1, perPage = 20) => {
  const sorting = keywords.includes('murah') ? 'price_asc' : keywords.includes('mahal') ? 'price_desc' : '';
  keywords = keywords.filter((word) => !['murah', 'mahal'].includes(word)).join(' dan ');
  console.log(sorting, keywords);
  const products = await getProducts(keywords, page, perPage, sorting);
  const processedProducts = products.result.map(processProductData);
  processedProducts.forEach((product) => {
    product.hargaNum = parseFloat(product.harga.replace(/[^0-9\.]/g, ''));
  });
  if (sorting === 'price_asc') {
    processedProducts.sort((a, b) => a.hargaNum - b.hargaNum);
  } else if (sorting === 'price_desc') {
    processedProducts.sort((a, b) => b.hargaNum - a.hargaNum);
  }
  return processedProducts;
};


const processProductData = (product) => {
  const { name, image_url, slug, min_price } = product;
  const link = `https://www.halodoc.com/obat-dan-vitamin/${slug}`;
  const imageUrl = image_url.replace('https', 'http');
  const hargaFormatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(min_price);
  const result = {
    name,
    link,
    imageUrl,
    harga: hargaFormatted,
  };
  return result;
};

export { helloWorld, getKeywords, getProducts, getProductsByKeyword };
