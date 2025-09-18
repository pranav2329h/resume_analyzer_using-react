import { type FormEvent, useEffect, useMemo, useState } from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "../../constants";

const Upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();

  const [isMounted, setIsMounted] = useState(false);           // <-- hydration-safe mount flag
  useEffect(() => setIsMounted(true), []);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (f: File | null) => setFile(f);

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: { companyName: string, jobTitle: string, jobDescription: string, file: File }) => {
    try {
      setIsProcessing(true);

      setStatusText('Uploading the file...');
      const uploadedFile = await fs.upload([file]);
      if (!uploadedFile) { setStatusText('Error: Failed to upload file'); return; }

      setStatusText('Converting to image...');
      const imageFile = await convertPdfToImage(file);
      if (!imageFile.file) { setStatusText('Error: Failed to convert PDF to image'); return; }

      setStatusText('Uploading the image...');
      const uploadedImage = await fs.upload([imageFile.file]);
      if (!uploadedImage) { setStatusText('Error: Failed to upload image'); return; }

      setStatusText('Preparing data...');
      const uuid = generateUUID();
      const data = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        companyName, jobTitle, jobDescription,
        feedback: '',
      };
      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      setStatusText('Analyzing...');
      const feedback = await ai.feedback(
        uploadedFile.path,
        prepareInstructions({ jobTitle, jobDescription })
      );
      if (!feedback) { setStatusText('Error: Failed to analyze resume'); return; }

      // Be robust to model response shapes
      const raw = typeof feedback.message.content === 'string'
        ? feedback.message.content
        : (feedback.message.content?.[0]?.text ?? '');

      let parsed: unknown = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        // Fall back: store raw text to avoid crashing
        parsed = { rawFeedback: raw };
      }

      data.feedback = parsed as any;
      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      setStatusText('Analysis complete, redirecting...');
      navigate(`/resume/${uuid}`);
    } catch (err) {
      console.error(err);
      setStatusText('Unexpected error during analysis');
    } finally {
      // keep isProcessing true until navigate to avoid flicker
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest('form');
    if (!form || !file) return;

    const formData = new FormData(form);
    const companyName = (formData.get('company-name') as string) || '';
    const jobTitle = (formData.get('job-title') as string) || '';
    const jobDescription = (formData.get('job-description') as string) || '';

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>

          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" alt="Analyzing resume animation" />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}

          {!isProcessing && (
            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
              </div>

              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                {/* SSR & first client render both show the same placeholder; swap to FileUploader after mount */}
                {isMounted ? (
                  <FileUploader onFileSelect={handleFileSelect} />
                ) : (
                  <input id="uploader" type="file" disabled aria-hidden />
                )}
              </div>

              <button className="primary-button" type="submit" disabled={!file || isProcessing}>
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
