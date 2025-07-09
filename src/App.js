import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function App() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [consolidated, setConsolidated] = useState({});
  const [formData, setFormData] = useState({});
  const [similarity, setSimilarity] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Prepopulate form with empty fields for visual purposes
    const initialForm = {};
    const fields = [
      'full_name',
      'surname',
      'sex',
      'date_of_birth',
      'nationality',
      'id_number',
      'issuing_date',
      'expiry_date',
      'issuing_country',
      'authority',
      'card_type'
    ];
    fields.forEach((key) => (initialForm[key] = ''));
    setFormData(initialForm);
  }, []);

  const handleUpload = async () => {
    if (!file1 || !file2) return alert('Please select both files.');

    const formDataUpload = new FormData();
    formDataUpload.append('file1', file1);
    formDataUpload.append('file2', file2);

    try {
      setLoading(true);
      const res = await axios.post('http://localhost:8000/upload', formDataUpload);
      const { document_1_details, document_2_details, consolidated_details, similarity_percentage } = res.data;

      setData1(document_1_details);
      setData2(document_2_details);
      setConsolidated(consolidated_details || {});
      setSimilarity(similarity_percentage);

      const initialForm = {};
      Object.keys(consolidated_details || {}).forEach((key) => {
        const value = consolidated_details[key];
        initialForm[key] = value && typeof value === 'object' ? '' : value;
      });
      setFormData(initialForm);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await axios.post('http://localhost:8000/save', formData);
      alert('Data submitted to database.');
    } catch (err) {
      console.error(err);
      alert('Failed to submit.');
    }
  };

  const handleInputChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const renderDataAsList = (data) => {
    return (
      <div className="text-sm bg-gray-100 p-3 rounded mt-2 space-y-1 max-h-100 overflow-y-auto">
        {Object.entries(data || {}).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-4 border-b pb-1">
            <span className="font-semibold capitalize text-gray-800">{key.replace(/_/g, ' ')}</span>
            <span className="text-left break-words text-gray-900 w-2/3">{value !== null ? String(value) : '-'}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#5CAB7D] shadow sticky top-0 z-50 p-6">
        <h1 className="text-3xl font-extrabold text-center text-white">
          AI-Powered Identity Document Reconciliation
        </h1>
      </div>

      {/* Main Layout */}
      <div className="p-6 flex gap-6">
        {/* Left: Upload and Data Display */}
        <div className="w-2/3 bg-white p-4 rounded shadow">
          {/* File Inputs */}
          <div className="flex justify-between mb-2">
            <div className="w-1/2 flex flex-col items-center px-2">
              <label className="block font-bold text-lg mb-1">ID Document 1</label>
              <input type="file" onChange={(e) => setFile1(e.target.files[0])} className="mb-2" />
            </div>
            <div className="w-1/2 flex flex-col items-center px-2">
              <label className="block font-bold text-lg mb-1">ID Document 2</label>
              <input type="file" onChange={(e) => setFile2(e.target.files[0])} className="mb-2" />
            </div>
          </div>

          {/* Centered Upload Button */}
          <div className="flex justify-center mt-2 mb-4">
            <button
              onClick={handleUpload}
              className="bg-[#5CAB7D] text-white px-6 py-2 rounded hover:bg-[#3D8C5F]"
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {/* Display Parsed Details */}
          <div className="flex justify-between mt-2">
            {data1 && <div className="w-1/2 px-2">{renderDataAsList(data1)}</div>}
            {data2 && <div className="w-1/2 px-2">{renderDataAsList(data2)}</div>}
          </div>

          {/* Similarity Percentage */}
          {similarity !== null && (
            <div className="mt-6 text-center">
              <p className="text-lg font-semibold text-[#2A6A45]">
                Similarity Match: <span className="text-2xl font-bold">{similarity}%</span>
              </p>
            </div>
          )}
        </div>

        {/* Right: Consolidated Form */}
        <div className="w-1/3 bg-white p-4 rounded shadow max-h-[80vh] overflow-y-auto">
          <h2 className="text-xl font-bold text-center mb-4 text-gray-800">Consolidated Form</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            {Object.keys(formData).map((key) => {
              const val = consolidated[key];
              return (
                <div className="mb-3" key={key}>
                  <label className="block text-sm font-bold text-gray-700 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  {val && typeof val === 'object' ? (
                    <select
                      value={formData[key]}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded p-1 text-sm"
                    >
                      <option value="">Select value</option>
                      <option value={val.document_1}>{val.document_1}</option>
                      <option value={val.document_2}>{val.document_2}</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData[key] || ''}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded p-1 text-sm"
                    />
                  )}
                </div>
              );
            })}
            <button
              onClick={handleSubmit}
              className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Submit to Database
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
