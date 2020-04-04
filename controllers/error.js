exports.get404 = (req, res) => {
  res.status(404).render('404', {
    title: 'Page Not Found',
    path: null,
    isAuthenticated: req.session.isLoggedIn
  });
};

exports.get500 = (req, res) => {
  res.status(500).render('500', {
    title: 'Page Not Found',
    path: null,
    isAuthenticated: req.session.isLoggedIn
  });
};
