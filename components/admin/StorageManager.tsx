/**
 * Storage Manager - Admin Component برای مدیریت Supabase Storage
 */

import React, { useState, useEffect } from 'react';
import { Upload, Trash2, FolderOpen, FileAudio, FileVideo, FileText, Image, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  StorageBuckets,
  listStorageFiles,
  uploadToStorage,
  deleteFromStorage,
  formatFileSize,
  isAudioFile,
  isVideoFile,
  isImageFile,
  isDocumentFile,
  downloadFile
} from '@/lib/storage';

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
}

const StorageManager: React.FC = () => {
  const { user } = useAuth();
  const [selectedBucket, setSelectedBucket] = useState<string>(StorageBuckets.WORSHIP_AUDIO);
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPath, setUploadPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const buckets = [
    { key: StorageBuckets.WORSHIP_AUDIO, label: 'Worship Audio', icon: FileAudio },
    { key: StorageBuckets.BIBLE_AUDIO, label: 'Bible Audio', icon: FileAudio },
    { key: StorageBuckets.SERMONS, label: 'Sermons', icon: FileVideo },
    { key: StorageBuckets.IMAGES, label: 'Images', icon: Image },
    { key: StorageBuckets.DOCUMENTS, label: 'Documents', icon: FileText },
    { key: StorageBuckets.VIDEOS, label: 'Videos', icon: FileVideo }
  ];

  useEffect(() => {
    loadFiles();
  }, [selectedBucket, currentFolder]);

  const loadFiles = async () => {
    if (!user?.token) return;

    setLoading(true);
    setError(null);

    try {
      const result = await listStorageFiles(selectedBucket, currentFolder, user.token);
      
      if (result.success && result.files) {
        setFiles(result.files);
      } else {
        setError(result.error || 'Failed to load files');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // پیشنهاد یک مسیر پیش‌فرض
      const suggestedPath = currentFolder 
        ? `${currentFolder}/${file.name}`
        : file.name;
      setUploadPath(suggestedPath);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user?.token) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await uploadToStorage(
        selectedFile,
        selectedBucket,
        uploadPath,
        user.token
      );

      if (result.success) {
        setSuccess(`File uploaded successfully: ${result.url}`);
        setSelectedFile(null);
        setUploadPath('');
        loadFiles(); // رفرش لیست
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filePath: string) => {
    if (!user?.token) return;
    
    if (!confirm(`Are you sure you want to delete ${filePath}?`)) return;

    setError(null);
    setSuccess(null);

    try {
      const result = await deleteFromStorage(selectedBucket, filePath, user.token);

      if (result.success) {
        setSuccess('File deleted successfully');
        loadFiles(); // رفرش لیست
      } else {
        setError(result.error || 'Delete failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      await downloadFile(fileUrl, fileName);
      setSuccess('Download started');
    } catch (err) {
      setError('Download failed');
    }
  };

  const getFileIcon = (fileName: string) => {
    if (isAudioFile(fileName)) return FileAudio;
    if (isVideoFile(fileName)) return FileVideo;
    if (isImageFile(fileName)) return Image;
    if (isDocumentFile(fileName)) return FileText;
    return FileText;
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Storage Manager</h1>

        {/* Bucket Selection */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {buckets.map(bucket => {
            const Icon = bucket.icon;
            return (
              <button
                key={bucket.key}
                onClick={() => {
                  setSelectedBucket(bucket.key);
                  setCurrentFolder('');
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedBucket === bucket.key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Icon className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm font-medium">{bucket.label}</div>
              </button>
            );
          })}
        </div>

        {/* Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Upload File</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select File</label>
              <input
                type="file"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {selectedFile && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Upload Path</label>
                  <input
                    type="text"
                    value={uploadPath}
                    onChange={(e) => setUploadPath(e.target.value)}
                    placeholder="folder/filename.mp3"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Bucket: {selectedBucket} / {uploadPath}
                  </p>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={uploading || !uploadPath}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Files List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Files</h2>
            <button
              onClick={loadFiles}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {currentFolder && (
            <div className="mb-4">
              <button
                onClick={() => setCurrentFolder('')}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <FolderOpen className="w-4 h-4" />
                ← Back to root
              </button>
              <div className="text-sm text-gray-600 mt-1">
                Current: {selectedBucket}/{currentFolder}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No files found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Type</th>
                    <th className="text-left py-2 px-4">Name</th>
                    <th className="text-left py-2 px-4">Size</th>
                    <th className="text-left py-2 px-4">Modified</th>
                    <th className="text-right py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => {
                    const Icon = getFileIcon(file.name);
                    return (
                      <tr key={file.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </td>
                        <td className="py-3 px-4 font-medium">{file.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatFileSize(file.metadata?.size || 0)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(file.updated_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleDownload(`https://your-project.supabase.co/storage/v1/object/public/${selectedBucket}/${file.name}`, file.name)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(file.name)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageManager;
