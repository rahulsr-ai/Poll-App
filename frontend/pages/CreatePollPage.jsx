// pages/CreatePoll.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreatePoll = () => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    
    // Clear error when user starts typing
    if (errors.options) {
      setErrors(prev => ({ ...prev, options: "" }));
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!question.trim()) {
      newErrors.question = "Poll question is required";
    }
    
    const validOptions = options.filter((opt) => opt.trim() !== "");
    if (validOptions.length < 2) {
      newErrors.options = "At least 2 options are required";
    }
    
    return newErrors;
  };

  const handleSubmit = async (isPublished) => {
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    const isUser = localStorage.getItem("user");

    if (!isUser) {
      alert("Please login to create polls!");
      navigate("/login");
      return;
    }

    const validOptions = options.filter((opt) => opt.trim() !== "");
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch("http://localhost:5000/api/create/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
          options: validOptions,
          creatorId: JSON.parse(isUser)?.id,
          isPublished: isPublished,
        }),
      });

      if (response.ok) {
        await response.json();
        
        // Success message based on publish status
        if (isPublished) {
          alert("Poll created and published successfully! 🎉");
        } else {
          alert("Poll saved as draft! You can publish it later. 📝");
        }
        
        // Reset form
        setQuestion("");
        setOptions(["", ""]);
        
        // Navigate to home page
        navigate("/");
        
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to create poll");
      }
    } catch (error) {
      console.error("Error creating poll:", error);
      alert("Error creating poll. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Save as Draft
  const handleSaveAsDraft = () => {
    handleSubmit(false);
  };

  // Handle Publish Now
  const handlePublishNow = () => {
    handleSubmit(true);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Poll
        </h1>
        <p className="text-gray-600">Ask a question and add options</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-6">
          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poll Question <span className="text-red-500">*</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (errors.question) setErrors(prev => ({ ...prev, question: "" }));
              }}
              placeholder="What would you like to ask your audience?"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.question ? 'border-red-500' : 'border-gray-300'
              }`}
              rows="3"
              maxLength={200}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.question && (
                <p className="text-red-500 text-sm">{errors.question}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {question.length}/200 characters
              </p>
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poll Options <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove option"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {errors.options && (
              <p className="text-red-500 text-sm mt-2">{errors.options}</p>
            )}

            {options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
              >
                <span className="mr-1">+</span> Add Option ({options.length}/6)
              </button>
            )}
          </div>

          {/* Action Buttons - Only 2 Options */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            {/* Save as Draft Button */}
            <button
              type="button"
              onClick={handleSaveAsDraft}
              disabled={loading}
              className={`flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
                  Saving Draft...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-2">📝</span>
                  Save as Draft
                </div>
              )}
            </button>

            {/* Publish Now Button */}
            <button
              type="button"
              onClick={handlePublishNow}
              disabled={loading}
              className={`flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all font-medium ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Publishing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-2">🚀</span>
                  Publish Now
                </div>
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="text-center bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="text-center">
                <div className="font-medium text-gray-700 mb-1">📝 Save as Draft</div>
                <div>Keep it private, publish later</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-700 mb-1">🚀 Publish Now</div>
                <div>Make it live and visible to everyone</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePoll;
