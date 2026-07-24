import { getCollection } from 'astro:content'

export async function getPublishedProducts(referenceDate = new Date()) {
	const products = await getCollection('products')
	return products
		.filter(
			(product) =>
				!product.data.draft &&
				product.data.publishDate.valueOf() <= referenceDate.valueOf(),
		)
		.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
}
