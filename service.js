import fs from "fs";
import axios from "axios";
import parameter from "./keywords.js";
import mqtt from "mqtt"

const helloWorld = async () => {
  return "Hello, World!";
};

// Array containing your keywords for price and rating
const keywordPriceRating = [
  'murah',
  'mahal',
  'produk',
  'rating',
  'bagus',
  'tinggi',
  'pilih',
  'barang',
  'penilaian',
  'terbaik',
  'favorit',
  'kualitas',
  'pengguna',
  'positif',
  'populer',
  'bintang lima',
  'paling baik',
];

const getKeywords = async (text) => {
  const words = text.replace(/,/g, "").split(/\s+/);
  console.log(words);

  let keywords = [];
  for (let i = 0; i < words.length; i++) {
    for (let j = 0; j < parameter.length; j++) {
      if (words[i].toLowerCase() === parameter[j].toLowerCase()) {
        keywords.push(parameter[j]);
      }
    }

    if (i < words.length - 1) {
      const twoWords = `${words[i]} ${words[i + 1]}`;
      for (let j = 0; j < parameter.length; j++) {
        if (twoWords.toLowerCase() === parameter[j].toLowerCase()) {
          keywords.push(parameter[j]);
        }
      }
    }
  }

  // If no disease keyword found, get AI keywords
  const diseaseKeywords = keywords.filter(word => !keywordPriceRating.includes(word));
  if (diseaseKeywords.length === 0) {
    const aiKeywords = await getKeywordsUsingAI(text);
    keywords.push(...aiKeywords.split(/\s+/));
  }

  //remove duplicate
  keywords = [...new Set(keywords)];
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
  const sorting = keywords.includes("murah")
    ? "price_asc"
    : keywords.includes("mahal")
    ? "price_desc"
    : "";
  keywords = keywords
    .filter((word) => !["murah", "mahal"].includes(word))
    .join(" dan ");
  console.log(sorting, keywords);
  const products = await getProducts(keywords, page, perPage, sorting);
  const processedProducts = products.result.map(processProductData);
  processedProducts.forEach((product) => {
    product.hargaNum = parseFloat(product.harga.replace(/[^0-9\.]/g, ""));
  });
  if (sorting === "price_asc") {
    processedProducts.sort((a, b) => a.hargaNum - b.hargaNum);
  } else if (sorting === "price_desc") {
    processedProducts.sort((a, b) => b.hargaNum - a.hargaNum);
  }
  return processedProducts;
};

const processProductData = (product) => {
  const { name, image_url, slug, min_price } = product;
  const link = `https://www.halodoc.com/obat-dan-vitamin/${slug}`;
  const imageUrl = image_url.replace("https", "http");
  const hargaFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(min_price);
  const result = {
    name,
    link,
    imageUrl,
    harga: hargaFormatted,
  };
  return result;
};

// Alodoc Service

const getProductAlodoc = async (searchTerm, page, perPage) => {
  console.log(searchTerm, page, perPage);
  const encodedSearchTerm = encodeURIComponent(searchTerm);
  const url = `https://www.alodokter.com/api/aloshop/products?term=${encodedSearchTerm}&page=${page}&per=${perPage}&category=`;
  try {
    const response = await axios.get(url);
    const data = response.data.result.data.map((product) => ({
      name: product.name,
      pack: product.pack,
      thumbnail_image: product.thumbnail_image,
      prices: product.price,
      link:
        "https://www.alodokter.com/aloshop/products/" +
        encodeURIComponent(product.name) +
        "/" +
        product.id,
      stock: product.stock,
      rating: product.rating,
      total_rated_amount: product.total_rated_amount,
      total_product_sold: product.total_product_sold,
    }));
    return data;
  } catch (error) {
    console.error(error);
  }
};

const getProductsByKeywordAlodoc = async (keywords, page = 1, perPage = 20) => {
  let keywordRating = [
    "produk",
    "rating",
    "bagus",
    "tinggi",
    "pilih",
    "barang",
    "penilaian",
    "terbaik",
    "favorit",
    "kualitas",
    "pengguna",
    "positif",
    "populer",
    "bintang lima",
    "paling baik",
  ];
  const sorting = keywords.includes("murah")
    ? "price_asc"
    : keywords.includes("mahal")
    ? "price_desc"
    : "";
  let rating;
  if (keywordRating.some((keyword) => keywords.includes(keyword))) {
    console.log("masuk rating");
    rating = "rating_desc";
  }

  keywords = keywords
    .filter((word) => !["murah", "mahal", ...keywordRating].includes(word))
    .join(" dan ");
  console.log(keywords);
  // console.log(sorting, rating);
  let products = await getProductAlodoc(keywords, page, perPage);
  if (sorting === "price_asc") {
    products = sortingAlodoc(products, true, false, "", "price_asc");
  } else if (sorting === "price_desc") {
    console.log("masuk price");
    products = sortingAlodoc(products, true, false, "", "price_desc");
  } else if (rating === "rating_desc") {
    products = sortingAlodoc(products, false, true, "rating_desc", "");
  }

  let fixKeyword = keywords.split(" dan ");

  let result = {
    keyword: fixKeyword,
    products: products,
  };
  return result;
};

const sortingAlodoc = (
  products,
  sortPrice,
  sortRating,
  ratingSortOrder,
  priceSortOrder
) => {
  let sortedProducts = [...products];

  sortedProducts.sort((a, b) => {
    let priceA = a?.prices?.amount || 0;
    let priceB = b?.prices?.amount || 0;
    let ratingA = parseFloat(a?.rating) || 0;
    let ratingB = parseFloat(b?.rating) || 0;

    if (sortPrice) {
      if (priceSortOrder === "price_asc") {
        return priceA - priceB;
      } else if (priceSortOrder === "price_desc") {
        return priceB - priceA;
      }
    } else if (sortRating) {
      if (ratingSortOrder === "rating_desc") {
        return ratingB - ratingA;
      } else if (ratingSortOrder === "rating_asc") {
        return ratingA - ratingB;
      }
    }

    return 0;
  });

  return sortedProducts;
};

const getKeywordsUsingAI = (kalimat) => {
  return new Promise((resolve, reject) => {
    const url_broker = "broker.hivemq.com";
    const port_broker = 1883;
    const client = mqtt.connect(`mqtt://${url_broker}:${port_broker}`);

    let sentence = kalimat.toString();

    client.on("connect", () => {
      client.subscribe("healthseeker2");
      client.publish("healthseeker", sentence);
    });

    client.on("message", (topic, message) => {
      if (topic === "healthseeker2") {
        client.end(); // end connection after receiving message
        resolve(message.toString()); // resolve promise with message
      }
    });

    // handle errors
    client.on("error", (err) => {
      client.end();
      reject(err);
    });
  });
};

const getDetailProductAlodoc = async (linkProduct) => {};

export {
  helloWorld,
  getKeywords,
  getProducts,
  getProductsByKeyword,
  getProductsByKeywordAlodoc,
};
