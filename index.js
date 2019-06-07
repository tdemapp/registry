const fetch = require('node-fetch');
const cache = require('micro-cacheable');

module.exports = cache(24 * 60 * 60 * 1000, async (req, res) => {
	res.setHeader('Content-Type', 'application/json');

	const fetchOptions = {
		method: 'GET',
		headers: {
			'Authorization': `token ${process.env.GH_ACCESS_TOKEN}`,
		},
	};

	try {
		const response = await fetch(
			`https://api.github.com/repos/tdemapp/registry/contents/extensions${req.url}`,
			fetchOptions
		);
		let data;

		if (response.status >= 200) {
			data = await response.json();
		}

		res.end(JSON.stringify({ success: true, message: data }, null, 2));
	} catch (err) {
		console.error(err);
		res.end(JSON.stringify({ success: false, message: err.message }, null, 2));
	}
});
