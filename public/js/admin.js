const deleteProduct = async btn => {
  try {
    const productId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
    const productElement = btn.closest('article');

    await fetch(`/admin/product/${productId}`, {
      method: 'DELETE',
      headers: {
        'csrf-token': csrf
      }
    });

    productElement.parentNode.removeChild(productElement);
  } catch (err) {
    console.log(err);
  }
};
