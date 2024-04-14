// api/request.js

module.exports = async (req, res) => {
  try {
    const { endpoint } = req.query;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint parameter is required' });
    }

    // Make a request to the specified endpoint
    const response = await fetch(endpoint);

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${endpoint}`);
    }

    // Parse the response as JSON
    const data = await response.json();

    // Send the response data
    res.status(200).json(data);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
