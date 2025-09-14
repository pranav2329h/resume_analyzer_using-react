import { prepareInstructions } from "constants/index";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { convertPdfToImage } from "~/lib/pdf2img";
import { usePuterStore } from "~/lib/puter";
import { generateUUID } from "~/lib/utils";

const Upload = () => {
  const {auth, isLoading, fs, ai, kv}=usePuterStore();
  const navigate=useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file,setFile]= useState<File | null>(null);
  const handleFileSelect=(file:File | null)=>{
    setFile(file)

  }
  const handleAnalyze=async({companyName,jobTitle, jobDescription, file}:{companyName:String,jobTitle:String, jobDescription:String, file:File})=>{
setIsProcessing(true);
setStatusText('uploading the files...');

const uploadedFile = await fs.upload([file]);

if(!uploadedFile) return setStatusText('Failed to upload the text');
setStatusText('converting to img.....');
const imageFile= await convertPdfToImage(file);
if(!imageFile.file) return setStatusText('error failed to convert img');

setStatusText('upload the img.....');
const uploadedImage= await fs.upload([imageFile.file]);
if(!uploadedImage) return setStatusText('Error: Failed to Upload the Img');

setStatusText('preparing data....');
const uuid= generateUUID();
const data={

  id: uuid,
  resumePath: uploadedFile.path,
  imagePath: uploadedImage.path,
  companyName, jobTitle, jobDescription,
  feedback:'',
}
await kv.set('resume:${uuid}',JSON.stringify(data));

setStatusText('analyzing...');

const feedback = await ai.feedback(
  uploadedFile.path,
  prepareInstructions({jobTitle, jobDescription})
)
if(!feedback) return setStatusText('Error: Failed to analyze Resume');

const feedbackText=typeof feedback.message.content=='string'
? feedback.message.content
:feedback.message.content[0].text;
data.feedback= JSON.parse(feedbackText);
await kv.set('resume:${uuid}',JSON.stringify(data));
setStatusText('analysis complete');
console.log(data);

  }
   const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  const form=e.currentTarget.closest('form');
  if(!form) return;
  const formData= new FormData(form);
  const companyName=formData.get('company-name')as String;
  const jobTitle=formData.get('job-title')as String;
  const jobDescription=formData.get('job-description')as String;
  if(!file) return;

  handleAnalyze({companyName,jobTitle, jobDescription, file});
  console.log({
    companyName, jobTitle, jobDescription, file
  })

  }

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading text-center py-16">
          <h1>Smart Feedback For Your Dream Job</h1>

          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img
                src="/images/resume-scan.gif"
                alt="Resume scanning animation"
                className="w-full max-w-md mx-auto"
              />
            </>
          ) : (
            <h2>Drop Your Resume For An ATS Score And Improvement Tips</h2>
          )}
          {!isProcessing &&(
            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8" >
                <div className="form-div">
                    <label htmlFor="company-name">Company Name</label>
                    <input type="text" name="company-name" placeholder="Company Name" id="company-name"/>
                </div>
                <div className="form-div">
                    <label htmlFor="job-title">Job Title</label>
                    <input type="text" name="job-title" placeholder="Job-Title" id="job-title"/>
                </div>
                <div className="form-div">
                    <label htmlFor="job-description">Job Description</label>
                    <textarea rows={5} name="job-description" placeholder="Job-Description" id="job-description"/>
                </div>
                <div className="form-div">
                    <label htmlFor="uploader">Upload Resume</label>
                    <FileUploader onFileSelect={handleFileSelect}/>
                </div>
                <button className="primary-button" type="submit">
                    Analyze Resume
                </button>

            </form>
          )}
        </div>
      </section>
    </main>
  );
}

export default Upload;
