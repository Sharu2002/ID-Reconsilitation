import React, { useState } from 'react';
import axios from 'axios';

export default function App() {
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [allData, setAllData] = useState([]);
  const [viewAll, setViewAll] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert('Please select a file.');
    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const res = await axios.post('http://localhost:8000/upload', formData);
      setExtractedData(res.data);
      setViewAll(false);
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/display');
      setAllData(res.data);
      setViewAll(true);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4 text-center">Identity Document Parser</h1>

      {/* Top: Upload */}
      <div className="bg-white p-6 rounded shadow mb-6 w-full max-w-2xl text-center">
        <h2 className="text-xl font-semibold mb-4">&emsp;&emsp;&emsp;&emsp;Upload Document</h2>
        &emsp;&emsp;&emsp;&emsp;<input type="file" onChange={handleFileChange} className="mb-4" />
        <div className="flex justify-center gap-4">
          &emsp;&emsp;&emsp;&emsp;<button
            onClick={handleUpload}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Upload
          </button>

          <button
            onClick={fetchAllData}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            View All Documents
          </button>
        </div>
      </div>

      {/* Bottom: Result */}
      <div className="bg-white p-6 rounded shadow w-full">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : viewAll ? (
          <div>
            <h2 className="text-xl font-semibold mb-2 text-center">All Documents</h2>
            <div className="overflow-auto max-h-[600px]">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">ID</th>
                    <th className="p-2">Issuing Country</th>
                    <th className="p-2">Authority</th>
                    <th className="p-2">Card Type</th>
                    <th className="p-2">Full Name</th>
                    <th className="p-2">Surname</th>
                    <th className="p-2">Sex</th>
                    <th className="p-2">DOB</th>
                    <th className="p-2">Age</th>
                    <th className="p-2">Nationality</th>
                    <th className="p-2">ID Number</th>
                    <th className="p-2">Issuing Date</th>
                    <th className="p-2">Expiry Date</th>
                    <th className="p-2">Signature Present</th>
                  </tr>
                </thead>
                <tbody>
                  {allData.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="p-2 text-center text-gray-500">
                        No documents found.
                      </td>
                    </tr>
                  ) : (
                    allData.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{item.id}</td>
                        <td className="p-2">{item.issuing_country || '-'}</td>
                        <td className="p-2">{item.authority || '-'}</td>
                        <td className="p-2">{item.card_type || '-'}</td>
                        <td className="p-2">{item.full_name || '-'}</td>
                        <td className="p-2">{item.surname || '-'}</td>
                        <td className="p-2">{item.sex || '-'}</td>
                        <td className="p-2">{item.date_of_birth || '-'}</td>
                        <td className="p-2">{item.age || '-'}</td>
                        <td className="p-2">{item.nationality || '-'}</td>
                        <td className="p-2">{item.id_number || '-'}</td>
                        <td className="p-2">{item.issuing_date || '-'}</td>
                        <td className="p-2">{item.expiry_date || '-'}</td>
                        <td className="p-2">{item.signature_present ? 'Yes' : 'No'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-2 text-center">Extracted Details</h2>
            {extractedData ? (
              <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-2 rounded">
                {JSON.stringify(extractedData, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500 text-center">Upload a file to see extracted data.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
