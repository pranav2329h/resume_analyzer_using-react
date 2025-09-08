import React, { useState } from "react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { formatSize } from "~/lib/utils";
interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0] || null;
      onFileSelect?.(file);
    },
    [onFileSelect]
  );
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      onDrop,
      multiple: false,
      accept: { "application/pdf": [".pdf"] },
      maxSize: maxFileSize,
    });
  const file = acceptedFiles[0] || null;
  return (
    <div className="w-full gradient-broder">
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <div className="space-y-4 cursor-pointer">
          <div className="mx-auto w-16 h-16 flex item-center justify-center">
            <img src="/icons/info.svg" alt="upload" className="size-20" />
          </div>
          {file ? (
            <div className="flex item-center space-x-3">
                <img src="/images/pdf.png" alt="pdf" className="size-10"/>
                <div>
                    <p className="text-sm font-medium text-gray-700 truncate ma-w-xs">
                    {file.name}
                </p>
                <p className="text-sm text-gray-500">
                    {formatSize(file.size)}
                </p>
                </div>
                
            </div>
          ) : (
            <div>
              <p className="text-lg text-gray-500 ">
                <span className="font-semibold">Click to upload</span> or Drag
                and Drop
              </p>
              <p className="text-lg text-gray-500 ">
                PDF (max{formatSize(maxFileSize)})
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
