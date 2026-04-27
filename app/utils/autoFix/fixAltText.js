// ============================================================
// Fix Missing Alt-text via Shopify API
// ============================================================
export async function fixAltText(admin, evidence) {
  const { imageUrl, productTitle } = evidence;

  if (!productTitle) {
    return { success: false, message: "Product title not found" };
  }

  // Find product by title
  const productQuery = await admin.graphql(`
    query findProduct($query: String!) {
      products(first: 1, query: $query) {
        nodes {
          id
          media(first: 20) {
            nodes {
              ... on MediaImage {
                id
                image { url }
              }
            }
          }
        }
      }
    }
  `, { variables: { query: `title:"${productTitle}"` } });

  const productData = await productQuery.json();
  const product = productData.data?.products?.nodes?.[0];

  if (!product) {
    return { success: false, message: `Product "${productTitle}" not found` };
  }

  // Find specific image
  const targetImage = product.media.nodes.find(
    (m) => m.image && m.image.url === imageUrl
  );

  if (!targetImage) {
    return { success: false, message: "Image not found" };
  }

  // Generate descriptive alt-text
  const altText = `${productTitle} - product image showing details and features`;

  // Update via mutation
  const updateMutation = await admin.graphql(`
    mutation updateMedia($media: [UpdateMediaInput!]!, $productId: ID!) {
      productUpdateMedia(media: $media, productId: $productId) {
        media { alt }
        mediaUserErrors { field, message }
      }
    }
  `, {
    variables: {
      productId: product.id,
      media: [{ id: targetImage.id, alt: altText }],
    },
  });

  const updateResult = await updateMutation.json();
  const errors = updateResult.data?.productUpdateMedia?.mediaUserErrors;

  if (errors && errors.length > 0) {
    return { success: false, message: errors[0].message };
  }

  return { success: true, message: `Alt-text added: "${altText}"` };
}