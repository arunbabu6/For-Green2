const ClientRequest = require('../models/ClientRequest');

const createClientRequest = async (req, res) => {
  const { username, email, description, requestedAmount } = req.body;

  try {
    const newClientRequest = new ClientRequest({
      username,
      email,
      description,
      requestedAmount,
    });

    const savedClientRequest = await newClientRequest.save();

    res.status(201).json(savedClientRequest);
  } catch (error) {
    console.error('Error creating user request:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = createClientRequest 