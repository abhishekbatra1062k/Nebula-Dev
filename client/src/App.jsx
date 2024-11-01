import { useEffect, useState, useCallback } from 'react'
import './App.css'
import Terminal from './components/terminal'
import FileTree from './components/tree'
import socket from './socket'
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

function App() {
  const [fileTree, setFileTree] = useState({})
  const [selectedFile, setSelectedFile] = useState('')
  const [selectedFileContent, setSelectedFileContent] = useState('')
  const [code, setCode] = useState('')
  const isSaved = selectedFileContent === code

  const BASE_URL = "http://localhost:9000/"

  
  const getFileTree = async () => {
    const response = await fetch(`${BASE_URL}files`)
    const result = await response.json()
    setFileTree(result.tree)
  }

  const getFileContents = useCallback(async () => {
    if(!selectedFile) return
    const response = await fetch(`${BASE_URL}files/content?path=${selectedFile}`)
    const result = await response.json()
    setSelectedFileContent(result.content)
  }, [selectedFile]) 

  useEffect(() => {
    getFileTree()
  }, [])

  useEffect(() => {
    socket.on("file:refresh", getFileTree)
    return () => {
      socket.off("file:refresh", getFileTree)
    }
  }, [])

  useEffect(() => {
    if(selectedFile && selectedFileContent){
      setCode(selectedFileContent)
    }
  }, [selectedFile, selectedFileContent])

  useEffect(() => {
    if(selectedFile) getFileContents()
  }, [selectedFile, getFileContents])

  useEffect(() => {
    setCode("")
  }, [selectedFile])

  useEffect(() => {
    if(code && !isSaved){
      const timer = setTimeout(() => {
        socket.emit('file:change', {
          path: selectedFile,
          content: code
        })
      }, 5*1000)
      return () => {
        clearTimeout(timer)
      }
    }
  }, [code, selectedFile, isSaved])

  return (
    <div className='playground-container'>
      <div className='editor-container'>
        <div className='files'>
          <FileTree onSelect={(path) => setSelectedFile(path)} tree={fileTree} />
        </div>
        <div className='editor'>
          {selectedFile && <p>{selectedFile.replaceAll('/', ' > ')} {isSaved ? "Saved": "Unsaved"}</p>}
          <AceEditor value={code} onChange={(e) => setCode(e)} />
        </div>
      </div>
      <div className='terminal-container'>
        <Terminal />
      </div>
    </div>
  )
}

export default App
