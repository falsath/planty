const User = require('../model/userModel')

const Product = require('../model/productModel')

const Category = require('../model/category')

const OrderModel = require('../model/orderModel')

const Offer = require('../model/categOfferModel');


const loadAllProduct = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const { search, category, sort, minPrice, maxPrice ,page=1} = req.query;
      const limit=6;
      const skip=(page-1)*limit;
      let query = { is_disabled: false };
  
      const categories = await Category.find();
  
      if (search) {
        query = {
          ...query,
          $or: [
            { name: { $regex: new RegExp(search, 'i') } },
            { description: { $regex: new RegExp(search, 'i') } },
          ],
        };
      }
  
      if (category) {
        query = {
          ...query,
          category: { $regex: category, $options: 'i' },
        };
      }
  
      // Add price range filter
      if (minPrice && maxPrice) {
        query.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
      } else if (minPrice) {
        query.price = { $gte: Number(minPrice) };
      } else if (maxPrice) {
        query.price = { $lte: Number(maxPrice) };
      }
  
      const expiredOffers = await Offer.find({ expireAt: { $lt: new Date() } });
  
      if (expiredOffers.length > 0) {
        for (const expiredOffer of expiredOffers) {
          const { category: expiredCategory } = expiredOffer;
          const cat = await Category.find({ categoryName: expiredCategory });
          const catIds = cat.map(category => category._id)
          const associatedProducts = await Product.find({ category_id: { $in: catIds }, is_offer: true });
  
          for (const product of associatedProducts) {
            const earlierPrice = product.earlierPrice;
            await Product.findByIdAndUpdate(
              product._id,
              {
                $set: {
                  price: earlierPrice,
                  is_offer: false
                }
              }
            );
          }
  
          await Offer.findByIdAndDelete(expiredOffer._id);
        }
      }
  
      // Determine sorting criteria
      let sortOptions = {};
      if (sort === 'name-asc') {
        sortOptions = { name: 1 };
      } else if (sort === 'name-desc') {
        sortOptions = { name: -1 };
      } else if (sort === 'price-asc') {
        sortOptions = { price: 1 };
      } else if (sort === 'price-desc') {
        sortOptions = { price: -1 };
      }



      // Fetch products with pagination
    const totalProducts = await Product.countDocuments(query);
    // const productData = await Product.find(query)
    //   .sort(sortOptions)
    //   .skip(skip)
    //   .limit(limit);

    // const totalPages = Math.ceil(totalProducts / limit);
  
      // Fetch products based on the updated query and sort options
      const productData = await Product.find(query).sort(sortOptions).skip(skip).limit(limit);
      const totalPages = Math.ceil(totalProducts / limit);
  
      res.render('allProduct', { product: productData, category: categories, userId ,currentPage:page,totalPages});
  
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  }
  

  const loadFilteredProducts = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const { category, sort, priceRangeMin, priceRangeMax } = req.query;

        const selectedCategoryId = category || '';

        const categories = await Category.find();

        // Base query for fetching products
        let query = { is_disabled: false };

        // Filter by category if selected
        if (category) {
            query.category_id = category;
        }

        // Filter by price range if provided
        if (priceRangeMin && priceRangeMax) {
            query.price = { $gte: Number(priceRangeMin), $lte: Number(priceRangeMax) };
        }

        // Fetch products from the database based on filters
        let filteredProductData = await Product.find(query).populate('category_id');

        filteredProductData = filteredProductData.map(product => {
            product.price = parseFloat(product.price); // Ensure price is a number
            product.name = product.name ? product.name.toString() : ''; // Ensure name is a string
            return product;
        });

        // Implement the sorting logic
        if (sort) {
            switch (sort) {
                case 'name-asc':
                    filteredProductData = filteredProductData.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'name-desc':
                    filteredProductData = filteredProductData.sort((a, b) => b.name.localeCompare(a.name));
                    break;
                case 'price-asc':
                    filteredProductData = filteredProductData.sort((a, b) => a.price - b.price);
                    break;
                case 'price-desc':
                    filteredProductData = filteredProductData.sort((a, b) => b.price - a.price);
                    break;
                case 'newest': // Sorting by the newest
                    filteredProductData = filteredProductData.sort((a, b) => b.createdAt - a.createdAt);
                    break;
                default:
                    break;
            }
        }

        // Handle expired offers
        const currentDate = new Date();
        const expiredOffers = await Offer.find({ expireAt: { $lt: currentDate } });
        if (expiredOffers.length > 0) {
            for (const expiredOffer of expiredOffers) {
                const { category: expiredCategory } = expiredOffer;
                const cat = await Category.find({ categoryName: expiredCategory });
                const catIds = cat.map((category) => category._id);
                const associatedProducts = await Product.find({ category_id: { $in: catIds }, is_offer: true });

                for (const product of associatedProducts) {
                    const earlierPrice = product.earlierPrice;
                    await Product.findByIdAndUpdate(product._id, {
                        $set: {
                            price: earlierPrice,
                            is_offer: false,
                        },
                    });
                }

                // Delete the expired offer
                await Offer.findByIdAndDelete(expiredOffer._id);
            }
            console.log('Expired offers deleted and products updated.');
            
        } else {
            console.log('No expired offers.');
        }

        res.render('filteredProducts', {
            product: filteredProductData,
            category: categories,
            userId,
           // selectedCategoryId,
           selectedCategoryId: category || '',
            sort,
            priceRangeMin,
            priceRangeMax,
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};



const loadProductDetails = async (req, res) => {
    try {
        const userId = req.session.user_id
        const id = req.query.id

        if (!id) {
            res.redirect('/home')
            return;
        }

        const product = await Product.findById(id).populate('category_id')

        console.log('Product:', product)

        if (product) {
            res.render('productDetails', { product, userId });
        } else {
            res.redirect('/home')
        }
    } catch (error) {
        console.log(error.message)
        res.redirect('/home')
    }
}



// .........................admmin.................................


const loadProductList = async (req, res) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const limit = 5; // Number of documents per page

        // Calculate the skip value
        const skip = (page - 1) * limit;

        // Query to count total active products
        console.log("viewproduct controller")
        const totalCount = await Product.countDocuments({ is_disabled: false });

        // Query to fetch active products with pagination
        const activeProducts = await Product.find({ is_disabled: false })
            .populate('category_id')
            .skip(skip)
            .limit(limit);

        // Render the Products view with pagination data
        res.render('products', {
            product: activeProducts,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit)
        });
    } catch (error) {
        console.log(error.message);
        // Handle error response
        res.status(500).send('Internal Server Error');
    }
};


// const loadProductList = async (req, res) => {

//     try {
//         const activeProducts = await Product.find({ is_disabled: false }).populate('category_id');

//         res.render('Products', { product: activeProducts });

//     } catch (error) {
//         console.log(error.message);
//     }

// }


const loadProduct = async (req, res) => {

    try {

        const categories = await fetchCategoriesFromDatabase();
        res.render('addProduct', { category: categories });

    } catch (error) {
        console.log(error.message);
    }
};

const fetchCategoriesFromDatabase = async () => {

    const category = await Category.find();
    return category;

};

const addProduct = async (req, res) => {
    try {
        const category = await Category.find()

        // Validate if quantity and price are non-negative
        const quantity = parseInt(req.body.quantity);
        const price = parseFloat(req.body.price);

        if (quantity < 0 || price < 0) {
            return res.render('addProduct', { message: 'Quantity and price must be non-negative', category });
        }

        const product = new Product({
            name: req.body.name,
            quantity: quantity,
            price: price,
            description: req.body.description,
            image: req.files ? req.files.map(file => file.filename) : [],
            category_id: req.body.category_id
        });

        const productData = await product.save();

        if (productData) {
            res.redirect('/admin/viewProduct');
        } else {
            res.render('addProduct', { message: 'Something Wrong', category });
        }

    } catch (error) {
        console.log(error.message);
        res.render('addProduct', { message: 'Error adding product', category });
    }
}


const softDeleteProduct = async (req, res) => {
    try {
        const id = req.query.id;

        if (!id) {
            return res.redirect('/admin/viewProduct');
        }

        const product = await Product.findByIdAndUpdate(
            id,
            { $set: { is_disabled: true } },
            { new: true }
        )

        if (product) {
            return res.redirect('/admin/viewProduct');
        } else {
            return res.redirect('/admin/viewProduct');
        }
    } catch (error) {
        console.error(error.message);
        res.redirect('/admin/viewProduct');
    }
}

const editProductLoad = async (req, res) => {

    try {
        const id = req.query.id;

        if (!id) {
            // Handle the case where id is undefined
            res.redirect('/admin/viewProduct');
            return;
        }

        const productList = await Product.findById(id).populate('category_id');

        if (productList) {
            const categories = await fetchCategoriesFromDatabase();
            res.render('editProduct', { product: productList, category: categories });
        } else {
            res.redirect('/admin/viewProduct');
        }
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin/viewProduct');
    }
}



const updateProduct = async(req,res)=>{
    try{
        const id=req.body.id;
        
       
        const product = await Product.findById({_id:id});
       const images = product.image;
   

       const arrImages = req.files.map(file => file.filename);
    
        const available = 3-images.length;
     
        const newImages = arrImages.slice(0,available);

        product.image = images.concat(newImages);
        console.log(product.image)


        const updateProduct = await Product.findByIdAndUpdate({_id:req.body.id},{$set:{name:req.body.name,quantity:req.body.quantity,price:req.body.price,description:req.body.description,image:product.image,category_id:req.body.category_id,earlierPrice:req.body.price}});
       if(updateProduct){
        res.redirect('/admin/viewProduct');
       }
        
    }   
    catch(err){
        console.log(err.message)
    }
}

const deleteImage = async(req,res)=>{
    try{
  
        const productId = req.query.pro;
        console.log('productId:',productId)
        const imgIndex = req.query.image;
        console.log('imgIndex:',imgIndex)
        const product = await Product.findById({_id:productId});
        console.log('product :',product )

    if (product) {
      // Remove the image at the specified index
      product.image.splice(imgIndex, 1);
      await product.save();
    }  
    res.redirect(`/admin/editProduct?id=${productId}`);
 
        //console.log(idToRemove,productId)
        /*const product = await Product.updateOne(
            { _id: productId },
            { $pull: { images: idToRemove } }
          );*/
        
    }
    catch(err){
        console.log(err.message)
    }
}




const productDetails = async (req, res) => {
  try {
    const productId = req.params.id;

    // Check if productId is valid MongoDB ObjectId
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('Invalid Product ID format:', productId);
      return res.status(400).send('Bad Request: Invalid Product ID format');
    }

    // Fetch the product details from the database
    const product = await Product.findById(productId);

    if (!product) {
      console.error('Product not found:', productId);
      return res.status(404).send('Product not found');
    }

    // Render the product details page
    res.render('productDetails', { product,userId:req.session.userId });
  } catch (error) {
    console.error('Error fetching product details:', error.message);
    res.status(500).send('Internal Server Error');
  }
};














module.exports = {
    loadProductDetails,
    loadFilteredProducts,
    loadAllProduct,

    // admin
    loadProductList,
    loadProduct,
    addProduct,
    editProductLoad,
    updateProduct,
    softDeleteProduct,
    deleteImage,
    productDetails
}