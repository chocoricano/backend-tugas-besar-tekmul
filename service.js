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

const getProductsByKeyword = async (keyword, page, perPage) => {
  
  let sorting;

  if (keyword.includes('murah')) {
    sorting = 'price_asc';
    keyword = keyword.filter((item) => item !== 'murah');
  } else if (keyword.includes('mahal')) {
    sorting = 'price_desc';
    keyword = keyword.filter((item) => item !== 'mahal');
  }
  console.log(sorting);
  let keywords = keyword.join(' ');

  keywords = keywords.replace(/ /g, ' dan ');
  console.log(keywords);

  let products = await getProducts(keywords, 1, 20);

  products = products.result;
  let newProducts = [];
  products.forEach((product) => {
    newProducts.push(processProductData(product));
  });

  if (sorting === 'price_asc') {
    newProducts.sort((a, b) => {
      let priceA = a.harga.replace(/[^0-9]/g, '');
      let priceB = b.harga.replace(/[^0-9]/g, '');
      return priceA - priceB;
    });
  } else if (sorting === 'price_desc') {
    newProducts.sort((a, b) => {
      let priceA = a.harga.replace(/[^0-9]/g, '');
      let priceB = b.harga.replace(/[^0-9]/g, '');
      return priceB - priceA;
    });
  }
  products = newProducts;
  // console.log(products);
    return products;
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
