const ogs = require('open-graph-scraper');

/**
 * Fetches Open Graph metadata (title, description, image) for a given URL.
 * Fails gracefully and returns nulls if the fetch fails or times out.
 */
async function fetchPreview(url) {
    try {
        const options = { url, timeout: 4000 };
        const { result, error } = await ogs(options);

        if (error) {
            return { title: null, description: null, image: null };
        }

        return {
            title: result.ogTitle || result.twitterTitle || null,
            description: result.ogDescription || result.twitterDescription || null,
            image: (result.ogImage && result.ogImage[0] && result.ogImage[0].url)
                || (result.twitterImage && result.twitterImage[0] && result.twitterImage[0].url)
                || null
        };
    } catch (err) {
        console.error('Error fetching link preview:', err.message);
        return { title: null, description: null, image: null };
    }
}

module.exports = { fetchPreview };
