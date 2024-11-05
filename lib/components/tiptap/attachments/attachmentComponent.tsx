import { NodeViewWrapper } from '@tiptap/react'
import React from 'react'

interface AttachmentProps {
  node: {
    attrs: {
      src: string
      fileName: string
      fileType: string
      fileSize: string
    }
  }
  selected: boolean
  extension: {
    options: {
      attachmentLayout?: (props: {
        selected: boolean
        src: string
        fileName: string
        fileSize: string
        fileType: string
      }) => React.ReactNode
    }
  }
}

export const AttachmentComponent: React.FC<AttachmentProps> = ({
  node,
  selected,
  extension,
}) => {
  const { src, fileName, fileType, fileSize } = node.attrs
  const { attachmentLayout } = extension.options
  const renderIcon = () => {
    // Render an icon based on file type (e.g., PDF icon for PDFs)
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word')) return '📝'
    if (fileType.includes('excel')) return '📊'
    return '📎' // Default icon for unknown file types
  }

  const attachmentProps = {
    selected: selected,
    src: src,
    fileName: fileName,
    fileSize: fileSize,
    fileType: fileType,
  }

  return (
    <NodeViewWrapper>
      {attachmentLayout ? (
        attachmentLayout(attachmentProps)
      ) : (
        <div className='attachment'>
          <span>{renderIcon()}</span>
          <a href={src} target='_blank' rel='noopener noreferrer'>
            {fileName || 'Download Attachment'}
          </a>
        </div>
      )}
    </NodeViewWrapper>
  )
}
