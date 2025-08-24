import React, { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";
import { X, Image } from "lucide-react";
import AutoResizeTextArea from "./AutoResizeTextArea"; 

const EditPostModal = ({ post, isOpen, onClose, onUpdated, setMenuOpen }) => {
  const [editContent, setEditContent] = useState(post?.content || "");
  const [existingImages, setExistingImages] = useState(post?.image_urls || []);
  const [newImages, setNewImages] = useState([]);
  const { getToken } = useAuth();
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setEditContent(post?.content || "");
      setExistingImages(post?.image_urls || []);
      setNewImages([]);
    }
  }, [isOpen, post]);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    const token = await getToken();
    const formData = new FormData();
    formData.append("content", editContent);
    newImages.forEach((file) => formData.append("images", file));
    formData.append("existingImages", JSON.stringify(existingImages));

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const { data } = await api.put(`/api/post/${post._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (data.success) {
        onUpdated(data.post);
        setMenuOpen(false);
      } else {
        throw new Error(data.message);
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    onClose();
  };

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    if (existingImages.length + newImages.length + files.length > 4) {
      toast.error("You can upload a maximum of 4 images");
      return;
    }
    setNewImages([...newImages, ...files]);
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-90 h-screen" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-100">
        <div className="bg-white rounded-xl shadow-lg w-96 max-h-[90vh] overflow-y-auto relative p-6">
          <h3 className="text-lg font-medium mb-3">Edit Post</h3>

          {/* Text Area */}
          <AutoResizeTextArea content={editContent} setContent={setEditContent} />

          {/* Existing Images */}
          {(existingImages.length > 0 || newImages.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {existingImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img src={img} alt="" className="h-20 rounded-md object-cover" />
                  <div
                    onClick={() =>
                      setExistingImages(existingImages.filter((_, i) => i !== idx))
                    }
                    className="absolute hidden group-hover:flex justify-center items-center top-0 right-0 bottom-0 left-0 bg-black/40 rounded-md cursor-pointer"
                  >
                    <X className="text-white w-5 h-5" />
                  </div>
                </div>
              ))}

              {/* New Images */}
              {newImages.map((file, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="h-20 rounded-md object-cover"
                  />
                  <div
                    onClick={() => setNewImages(newImages.filter((_, i) => i !== idx))}
                    className="absolute hidden group-hover:flex justify-center items-center top-0 right-0 bottom-0 left-0 bg-black/40 rounded-md cursor-pointer"
                  >
                    <X className="text-white w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-300 mt-4">
            <label
              htmlFor="editImages"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer"
            >
              <Image className="size-6" />
              Add Images
            </label>
            <input
              type="file"
              id="editImages"
              accept="image/*"
              hidden
              multiple
              onChange={handleNewImages}
            />
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  toast.promise(handleUpdate(), {
                    loading: "Updating post...",
                    // success: "Post updated successfully!",
                    error: "Failed to update post",
                  }).then(() => handleClose())
                }
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditPostModal;
