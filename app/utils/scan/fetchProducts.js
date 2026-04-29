// ============================================================
// Fetch products with plan-based pagination
// ============================================================
export async function fetchProducts(admin, productLimit) {
  const fetchSize = Math.min(productLimit, 250);

  const productResponse = await admin.graphql(`
    query getProducts($first: Int!) {
      products(first: $first) {
        nodes {
          id
          title
          handle
          media(first: 10) {
            nodes {
              ... on MediaImage {
                alt
                image { url }
              }
            }
          }
        }
        pageInfo { hasNextPage, endCursor }
      }
    }
  `, { variables: { first: fetchSize } });

  let productData = await productResponse.json();
  let products = productData.data.products.nodes;

  // Pagination for plans with > 250 product limit
  if (productLimit > 250 && productData.data.products.pageInfo?.hasNextPage) {
    let cursor = productData.data.products.pageInfo.endCursor;

    while (products.length < productLimit && cursor) {
      const remaining = productLimit - products.length;
      const nextSize = Math.min(remaining, 250);

      const nextResponse = await admin.graphql(`
        query getMoreProducts($first: Int!, $after: String) {
          products(first: $first, after: $after) {
            nodes {
              id
              title
              handle
              media(first: 10) {
                nodes {
                  ... on MediaImage {
                    alt
                    image { url }
                  }
                }
              }
            }
            pageInfo { hasNextPage, endCursor }
          }
        }
      `, { variables: { first: nextSize, after: cursor } });

      const nextData = await nextResponse.json();
      products = products.concat(nextData.data.products.nodes);
      cursor = nextData.data.products.pageInfo.hasNextPage
        ? nextData.data.products.pageInfo.endCursor
        : null;

      console.log(`>>> Fetched: ${products.length}/${productLimit}`);
    }
  }

  // Trim to exact limit
  if (products.length > productLimit) {
    products = products.slice(0, productLimit);
  }

  return products;
}