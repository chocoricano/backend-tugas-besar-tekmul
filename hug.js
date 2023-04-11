async function query(data) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/abid/indonesia-bioner",
		{
			headers: { Authorization: "Bearer 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" },
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

query({"inputs": "Aku sedang pusing dan lemas, tapi kenapa aku kok ngantuk"}).then((response) => {
	console.log(JSON.stringify(response));
});