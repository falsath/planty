
const Category = require('../model/category')

const loadCategory = async (req, res) => {

    try {

        res.render('category');

    } catch (error) {
        console.log(error.message);
    }
}

const addCategory = async (req, res) => {

    try {

        const categoryName = req.body.categoryName

        const existingCategory = await Category.findOne({ categoryName: { $regex: new RegExp(categoryName, "i") } });

        if (existingCategory) {
            return res.render('category', { message: 'Existing Category', exist: true })
        }


        const category = new Category({ categoryName });
        const savedCategory = await category.save();

        if (savedCategory) {

            return res.redirect('/admin/viewCategory');
        } else {

            return res.render('category', { message: 'Something went wrong with saving the category.' });
        }
    } catch (error) {

        console.error('Error saving category:', error);
        return res.render('category', { message: 'Error saving the category.' });
    }
};

const loadCategoryList = async (req, res) => {

    try {

        const categoryList = await Category.find({ isDeleted: false });
        res.render('category-list', { category: categoryList })

    } catch (error) {
        console.log(error.message);
    }

}

const editCategoryLoad = async (req, res) => {

    try {

        const id = req.query.id;

        const categoryList = await Category.findById({ _id: id });

        if (categoryList) {
            res.render('editCategory', { category: categoryList });
            console.log(categoryList)
        } else {
            res.redirect('/admin/viewCategory');
        }

    } catch (error) {
        console.log(error.message);
    }

};

const editCategory = async (req, res) => {
    try {
        const categoryId = req.body.id;
        const categoryname = req.body.name;

        console.log(categoryId)
        console.log(categoryname)

        if (!categoryname) {
            return res.render('editCategory', { errorMessage: 'Category name is required' });
        }

        const existingCategory = await Category.findOne({ categoryName: { $regex: new RegExp(categoryname, "i") } });
        if (existingCategory) {
            return res.render('editCategory', { message: 'Existing Category', exist: true, category: { _id: categoryId, categoryName: categoryname } });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            { categoryName: categoryname },
            { new: true }
        );

        if (updatedCategory) {
            res.redirect('/admin/viewCategory');
        } else {
            res.render('editCategory', { errorMessage: 'Error updating category' });
        }
    } catch (error) {
        console.error(error.message);
        res.render('editCategory', { errorMessage: 'Error updating category' });
    }
};


const deleteCategory = async (req, res) => {
    try {
        const id = req.query.id;

        // Soft delete: Mark the category as deleted instead of removing it from the database
        const result = await Category.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );

        if (result) {
            res.redirect('/admin/viewCategory');
        } else {
            res.render('error', { errorMessage: 'Error deleting category' });
        }
    } catch (error) {
        console.error(error.message);
        res.render('error', { errorMessage: 'Error deleting category' });
    }
};



module.exports = {

    loadCategory,
    addCategory,
    loadCategoryList,
    editCategoryLoad,
    editCategory,
    deleteCategory

}