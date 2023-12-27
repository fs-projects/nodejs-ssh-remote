/* eslint-disable @typescript-eslint/no-explicit-any */
import {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import { handleFileUpload } from './parsingValidation'

export default function DropzoneArea({handleFileChange}) {
  const onDrop = useCallback((acceptedFiles: any[]) => {
    acceptedFiles.forEach((file: Blob) => {
        const reader = new FileReader()
        reader.readAsText(file)
        reader.onabort = () => console.log('file reading was aborted')
        reader.onerror = () => console.log('file reading has failed')
        reader.onload = async () => {
        const fileParsed = await handleFileUpload(reader.result);
        console.log("file parsed", fileParsed)
        handleFileChange(fileParsed);
        }
      })
  }, [])
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {
        isDragActive ?
          <p>Drop the files here ...</p> :
          <p>Drag 'n' drop some files here, or click to select files</p>
      }
    </div>
  )
}