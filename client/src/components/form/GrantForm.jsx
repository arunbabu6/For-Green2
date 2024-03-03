import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

function GrantForm({ closeModal, cardData }) {
  const { user } = useAuth0();
  const [projectDescription, setProjectDescription] = useState('');
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e) => {
    const newInputValue = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(newInputValue);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const requestedAmount = parseFloat(inputValue);

    if (isNaN(requestedAmount) || requestedAmount < 1 || requestedAmount > cardData.rate) {
      alert('Limit exceeds!!');
      return;
    }

    const grantData = {
      userName: user.email,
      email: user.email,
      projectDescription,
      requestedAmount,
    };

    console.log('Grant Application Data:', grantData);

    closeModal();
    alert('Your grant application has been submitted!');
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-opacity-75 bg-white flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-md p-8 w-96">
        <h2 className="font-extrabold text-xl mb-4">{cardData.name}</h2>
        <h2 className="text-lg mb-4">Grant Application</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
          <div className="mb-4">
                        <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
                            User Name:
                        </label>
                        <input
                            type="text"
                            id="userName"
                            value={user.email}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-green-500 focus:ring-1"
                            readOnly
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email:
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={user.email}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-green-500 focus:ring-1"
                            readOnly
                        />
                    </div>
            <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700">
              Project Description:
            </label>
            <textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="w-full h-24 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-green-500 focus:ring-1"
              required
            />
          </div>
          <div className="relative">
            <label htmlFor="requestedAmount" className="block text-sm font-medium text-gray-700">
              Requested Amount:
            </label>
            <div className="flex items-center">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input
                type="text"
                id="requestedAmount"
                name="requestedAmount"
                value={inputValue}
                onChange={handleInputChange}
                pattern="[0-9]*"
                maxLength={String(cardData.rate).length}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-green-500 focus:ring-1"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-700 focus:ring-green-500 focus:ring-opacity-50"
          >
            Submit Application
          </button>
          <button
            type="button"
            onClick={closeModal}
            className="w-full py-2 px-4 mt-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-indigo-500 focus:ring-opacity-50"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

export default GrantForm;
