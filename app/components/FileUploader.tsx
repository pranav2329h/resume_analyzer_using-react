import React, { useState } from "react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

const FileUploader = () => {
    const [file, setFile]= useState();
  const onDrop = useCallback((acceptedFiles:File[]) => {
    // Do something with the files
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="w-full gradient-broder">
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <div className="space-y-4 cursor-pointer">
            <div className="mx-auto w-16 h-16 flex item-center justify-center">
                <img src="/icons/info.svg" alt="upload" className="size-20" />
            </div>
            {file?(
                <div>

                    
                </div>
            ):(
                <div>
                    <p className="text-lg text-gray-500 ">
                        <span className="font-semibold">
                            Click to upload
                        </span> or Drag and Drop
                    </p>
                    <p className="text-lg text-gray-500 ">PDF (Max 20MB)</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
