
const bcrypt=require('bcryptjs')
const User=require('../../models/userSchema')
const { DEFAULT_PAGE_SIZE, normalizePage, buildPagination } = require('./pagination');




//User management controllers
exports.getUsers=async (req, res) => {
    const page = normalizePage(req.query.page);
    const limit = DEFAULT_PAGE_SIZE;
    const totalUsers = await User.countDocuments();
    const pagination = buildPagination(page, limit, totalUsers);
    const users = await User.find()
        .sort({ _id: -1 })
        .skip((pagination.currentPage - 1) * limit)
        .limit(limit);
    const success_msg = req.session.success_msg;
    const error_msg = req.session.error_msg;

    req.session.success_msg = null;
    req.session.error_msg = null;

    res.render('adminLayout',{
        title:"Users",
        content:'partials/usersList',
        users,
        pagination,
        totalUsers,
        success_msg: success_msg,
        error_msg: error_msg,
    }) 
  }
//controller to render edit page
  exports.getEditUser= async (req, res) => {
    const user = await User.findById(req.params.id);
    res.render('admin/editUser', { user });
  };

  //controller to update user details
  exports.postEditUser = async (req, res) => {
    const { name, email, password } = req.body;
    
    
    let updateData = { name, email };
    
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
    }
    
    await User.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/admin/users');
};
  // controller to Delete User 
  exports.postDeleteUser= async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/users');
  }
  // controller to Block user controls
  exports.postBlockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.isBlocked = !user.isBlocked; 
            await user.save();
            req.session.success_msg = user.isBlocked ? 
                'User has been blocked successfully.' : 
                'User has been unblocked successfully.';
            res.redirect('/admin/users');
        } else {
            req.session.error_msg = 'User not found';
            res.redirect('/admin/users');
        }
    } catch (err) {
        console.error(err);
        req.session.error_msg = 'An error occurred while processing your request';
        res.redirect('/admin/users');
    }
};
