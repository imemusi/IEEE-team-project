import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useClasses } from './context/ClassesContext';
import { db, storage } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const RESOURCE_TAGS = ['Notes', 'Past Exams', 'Study Guides', 'Other'];

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('Notes');
  const [filterTag, setFilterTag] = useState('All');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();
  const { activeClass } = useClasses();
  const classId = activeClass?.id || null;

  // Subscribe to resources for the active class
  useEffect(() => {
    setResources([]);
    if (!classId) return;
    let unsubscribe = null;
    try {
      const q = query(collection(db, `classes/${classId}/resources`), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        setResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => {
        console.warn('resources snapshot error:', err.code, err.message);
      });
    } catch (e) {
      console.warn('resources onSnapshot failed:', e.message);
    }
    return () => { try { unsubscribe?.() } catch (_) {} };
  }, [classId]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPendingFile(file);
      setIsModalOpen(true);
    }
    // reset input value so the same file could be selected again if needed
    e.target.value = null;
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!pendingFile || !user || !classId) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const storageRef = ref(storage, `classes/${classId}/resources/${Date.now()}_${pendingFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, pendingFile);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          resolve,
        );
      });

      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      await addDoc(collection(db, `classes/${classId}/resources`), {
        name: pendingFile.name,
        type: pendingFile.type || 'File',
        description: description,
        tag: tag,
        uploader: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        uploaderId: user.uid,
        size: pendingFile.size < 1024 * 1024
          ? (pendingFile.size / 1024).toFixed(1) + ' KB'
          : (pendingFile.size / 1024 / 1024).toFixed(2) + ' MB',
        url: downloadURL,
        createdAt: serverTimestamp(),
      });

      handleCloseModal();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPendingFile(null);
    setDescription('');
    setTag('Notes');
    setIsUploading(false);
  };

  const displayedResources = filterTag === 'All' 
    ? resources 
    : resources.filter(r => r.tag === filterTag);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-page h-full relative">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-primary mb-2">Study Resources</h1>
            <p className="text-sub">
              {activeClass
                ? `${activeClass.code} — ${activeClass.title}`
                : 'Select a class from the sidebar to view resources.'}
            </p>
          </div>
          
          <div>
            <label className={`cursor-pointer bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg font-medium transition-colors inline-block ${!classId ? 'opacity-40 pointer-events-none' : ''}`}>
              Upload File
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileSelect}
                disabled={!classId}
              />
            </label>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-2 border-b border-line pb-4 overflow-x-auto">
          <button 
            onClick={() => setFilterTag('All')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${filterTag === 'All' ? 'bg-brand text-white' : 'bg-surface text-sub border border-line hover:bg-page'}`}
          >
            All Resources
          </button>
          {RESOURCE_TAGS.map(t => (
            <button 
              key={t}
              onClick={() => setFilterTag(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border border-line ${filterTag === t ? 'bg-brand text-white border-transparent' : 'bg-surface text-sub hover:bg-page'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Resources List */}
        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          <div className="divide-y divide-line">
            {displayedResources.map((resource) => (
              <div key={resource.id} className="p-4 flex items-center justify-between hover:bg-page transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-brand/10 text-brand flex flex-shrink-0 items-center justify-center font-bold text-xs uppercase">
                    {resource.name.split('.').pop().substring(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-primary truncate max-w-xs sm:max-w-sm md:max-w-md">{resource.name}</h3>
                      {resource.tag && (
                        <span className="bg-brand/10 text-brand text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded">
                          {resource.tag}
                        </span>
                      )}
                    </div>
                    {resource.description && (
                      <p className="text-sm font-medium text-sub mb-0.5">{resource.description}</p>
                    )}
                    <p className="text-xs text-muted mt-1">
                      Uploaded by <span className="font-medium text-primary">{resource.uploader}</span> • {resource.createdAt ? new Date(resource.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted hidden sm:inline-block">{resource.size}</span>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-hover font-semibold text-sm bg-brand/5 px-3 py-1.5 rounded-lg transition-colors inline-block">
                    Download
                  </a>
                </div>
              </div>
            ))}
            {displayedResources.length === 0 && (
              <div className="p-8 text-center text-sub">
                No resources available.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-xl border border-line">
            <h2 className="text-xl font-bold text-primary mb-1">File Details</h2>
            <p className="text-sm text-sub mb-4">Add a description for your file before uploading.</p>
            
            <form onSubmit={handleUploadSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-primary mb-1">File</label>
                <div className="px-3 py-2 bg-page border border-line rounded-lg text-sm text-sub break-all">
                  {pendingFile?.name}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-primary mb-1">Resource Type</label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full px-3 py-2 bg-page border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-primary font-medium"
                >
                  {RESOURCE_TAGS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-primary mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Midterm study guide covering chapters 1-4..."
                  className="w-full px-3 py-2 bg-page border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand min-h-[80px]"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-sub hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  disabled={!description.trim() || isUploading}
                >
                  {isUploading ? `Uploading… ${uploadProgress}%` : 'Upload File'}
                </button>
              </div>
              {isUploading && (
                <div className="mt-3 w-full bg-line rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-brand h-1.5 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
