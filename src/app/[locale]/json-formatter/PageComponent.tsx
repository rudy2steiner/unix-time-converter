'use client'
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import {useState,useEffect,useCallback,useRef} from "react";
import HeadInfo from "~/components/HeadInfo";
import {useCommonContext} from "~/context/common-context";
import {useInterval} from "ahooks";
import Link from "next/link";
import Script from 'next/script'
import { languages,getLanguageByLang,getEditorLocale} from "~/config";
import * as monaco from 'monaco-editor';
import {Editor,loader,useMonaco,DiffEditor} from "@monaco-editor/react";
import { Stack, IStackStyles } from "@fluentui/react";
import { ErrorMessageBar } from "~/components/error-message-bar";
import { TitleBar } from "~/components/title-bar";
import { ToolBar } from "~/components/tool-bar";
import { BorderLine } from "~/components/styles";
import { initializeIcons } from "@fluentui/react/lib/Icons";
import { useToggle } from "~/hooks";

import {
  downloadJsonFile,
  minifyJsonString,
  prettifyJsonString,
  parseJsonSchemaString,
} from "~/utils";

initializeIcons();
const stackStyles: IStackStyles = {
  root: {
    height: "inherit",
    borderTop: BorderLine,
    borderBottom: BorderLine,
  },
};

loader.config({ paths: { vs: "/vs" } });

const compareSampleOriginal = `{
  "service": "orders",
  "version": 1,
  "features": {
    "audit": false,
    "retries": 1
  },
  "regions": ["us-east-1", "eu-west-1"]
}`;

const compareSampleModified = `{
  "service": "orders",
  "version": 2,
  "features": {
    "audit": true,
    "retries": 3,
    "timeoutMs": 1500
  },
  "regions": ["us-east-1", "eu-west-1", "ap-southeast-1"]
}`;

const PageComponent = ({
                         locale = '',
                         indexLanguageText,
                         footerLanguageText,
                         jsonEditorText
                       }) => {

  const editorRef = useRef(null);
  const diffEditorRef = useRef(null);
  const demoEditorRef = useRef(null);
  const editorLocale = getEditorLocale(locale);
  console.log('editor mount locale:'+{locale}+'->'+editorLocale);
  const [isValidJson, setIsValidJson] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isAutoPrettifyOn, toggleAutoPrettifyOn] = useToggle(false);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareOriginal, setCompareOriginal] = useState('');
  const [compareModified, setCompareModified] = useState('');
  function handleEditorDidMount(editor, monaco) {
      editorRef.current = editor;
  }
  function handleDiffEditorDidMount(editor, monaco) {
      diffEditorRef.current = editor;
  }
  function handleExampleEditorDidMount(editor, monaco) {
    console.log('handleEditorDidMount');
    const handler = editor.onDidChangeModelDecorations(_ => {
      handler.dispose();
      editor.getAction("editor.action.formatDocument").run();
    });
  }
  function format() {
    if (isCompareMode && diffEditorRef.current) {
      diffEditorRef.current.getOriginalEditor().trigger('', 'editor.action.formatDocument');
      diffEditorRef.current.getModifiedEditor().trigger('', 'editor.action.formatDocument');
      return;
    }
    editorRef.current?.trigger('', 'editor.action.formatDocument');
  }
  function normalizeJsonText(value: string) {
    const lines = value.split("\n");
    const trimmedLines = lines.map((line) => line.trim());
    const filteredLines = trimmedLines.filter((line) => line !== "");
    return filteredLines.join("");
  }
  function minify() {
      if (isCompareMode && diffEditorRef.current) {
        const originalEditor = diffEditorRef.current.getOriginalEditor();
        const modifiedEditor = diffEditorRef.current.getModifiedEditor();
        const originalText = originalEditor.getValue() || "";
        const modifiedText = modifiedEditor.getValue() || "";
        originalEditor.getModel().setValue(normalizeJsonText(originalText));
        modifiedEditor.getModel().setValue(normalizeJsonText(modifiedText));
        return;
      }
      if (editorRef.current.getValue() == undefined || editorRef.current.getValue().length==0) {
           console.log("empty")
           return
        }
        console.log(editorRef.current.getValue())
        const finalJson = normalizeJsonText(editorRef.current.getValue());
        editorRef.current.getModel().setValue(finalJson);
  }
  const handleEditorValidation= useCallback((markers) => {
      const errorMessage = markers.map(
        ({ startLineNumber, message }) => `line ${startLineNumber}: ${message}`
      );
      const hasContent = editorRef.current?.getValue();
      const hasError: boolean = errorMessage.length > 0;
      setIsValidJson(!!hasContent && !hasError);
      setErrors(errorMessage);
   }, []);
   const handleExampleEditorValidation= useCallback((markers) => {
      console.log('example validate');
      demoEditorRef.current.trigger('', 'editor.action.formatDocument');
    }, []);
    const handleDownloadClick = () => {
    const value = isCompareMode && diffEditorRef.current
      ? diffEditorRef.current.getModifiedEditor().getValue()
      : editorRef.current?.getValue();
    value && downloadJsonFile(value);
    };
   const handleCompareClick = () => {
      if (isCompareMode && diffEditorRef.current) {
        const latestOriginal = diffEditorRef.current.getOriginalEditor().getValue() || "";
        const latestModified = diffEditorRef.current.getModifiedEditor().getValue() || "";
        setCompareOriginal(latestOriginal);
        setCompareModified(latestModified);
      }
      if (!isCompareMode) {
        const hasExistingCompareContent =
          compareOriginal.trim().length > 0 || compareModified.trim().length > 0;
        if (!hasExistingCompareContent) {
          const currentValue = editorRef.current?.getValue() || "";
          if (currentValue.trim().length === 0) {
            setCompareOriginal(compareSampleOriginal);
            setCompareModified(compareSampleModified);
          } else {
            setCompareOriginal(currentValue);
            setCompareModified(currentValue);
          }
        }
      }
      setIsCompareMode((prev) => !prev);
   };
   const handleEditorChange = useCallback(
       (value: string | undefined) => {
         if (isAutoPrettifyOn) {
            editorRef.current.trigger('', 'editor.action.formatDocument');
         }
         console.log(editorRef.current?.getValue());
       },
       [isAutoPrettifyOn]
  );
  const handleUploadClick = (file: File) => {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const result = fileReader.result as string;
        if (isCompareMode) {
          if (diffEditorRef.current) {
            diffEditorRef.current.getModifiedEditor().getModel().setValue(result || "");
            diffEditorRef.current.getModifiedEditor().getAction("editor.action.formatDocument")?.run();
          } else {
            setCompareModified(result || "");
          }
          return;
        }
        handleEditorUpdateValue(result);
      };
      fileReader.readAsText(file);
   };
  const handleEditorUpdateValue = useCallback((value?: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.setValue(value || "");
      value && editor?.getAction("editor.action.formatDocument")?.run();
    }, []);
  const handleClearClick = () => {
    if (isCompareMode) {
      if (diffEditorRef.current) {
        diffEditorRef.current.getOriginalEditor().getModel().setValue("");
        diffEditorRef.current.getModifiedEditor().getModel().setValue("");
      }
      setCompareOriginal("");
      setCompareModified("");
      return;
    }
    editorRef.current?.setValue("");
  };
  const diffEditorOptions = {
    originalEditable: true,
  };

  return (
    <>
       <HeadInfo
           title={jsonEditorText.title}
           description={jsonEditorText.description}
           keywords={jsonEditorText.keywords}
           locale={locale}
           page={"/json-formatter"}
         />
       <Header locale={locale} page={"json-formatter"} indexLanguageText={indexLanguageText}/>
       {/* <p className="text-black text-center text-xl mb-3 mt-10">{jsonEditorText.title}</p> */}
       <div className="mx-auto w-[80%] h-[100%] border-blue-200 border-2 mb-2 mt-3">
         <Stack styles={stackStyles}>
            <Stack.Item>
               <ToolBar
                 isAutoPrettifyOn={isAutoPrettifyOn}
                 isCompareMode={isCompareMode}
                 onAutoPrettifyChange={toggleAutoPrettifyOn}
                 onClearClick={handleClearClick}
                 onDownloadClick={handleDownloadClick}
                 onMinifyClick={minify}
                 onPrettifyClick={format}
                 onCompareClick={handleCompareClick}
                 onUploadClick={handleUploadClick}
                 toolTexts={jsonEditorText} />
            </Stack.Item>
            <Stack styles={stackStyles}>
                <Stack.Item
                          grow
                          align="stretch"
                          style={{
                            height: `calc(100% - 20vh)`,
                          }}
                        >
                {isCompareMode ? (
                  <DiffEditor
                    height="calc(60vh)"
                    language="json"
                    original={compareOriginal}
                    modified={compareModified}
                    options={diffEditorOptions}
                    onMount={handleDiffEditorDidMount}
                  />
                ) : (
                  <Editor
                    height="calc(60vh)"
                    language="json"
                    defaultValue=''
                    onMount={handleEditorDidMount}
                    onChange={handleEditorChange}
                    onValidate={handleEditorValidation}
                  />
                )}
                 </Stack.Item>
                 <Stack.Item
                   style={{
                     height: `15vh`,
                   }}
                 >
                   <ErrorMessageBar errors={errors} toolTexts={jsonEditorText} />
                 </Stack.Item>
             </Stack>
         </Stack>
       </div>
       <section className="bg-white dark:bg-gray-900">
         <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
             {/* Header */}
             <div className="max-w-4xl mb-12 lg:mb-16 mx-auto">
                 <h1 className="mb-6 text-4xl sm:text-5xl lg:text-6xl tracking-tight font-extrabold text-gray-900 dark:text-white leading-tight text-center">
                     {jsonEditorText.h1 || ''}
                 </h1>
                 <p className="text-gray-600 dark:text-gray-300 sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto text-left">
                     {jsonEditorText.h1_desc || ''}
                 </p>
             </div>

             {/* Features Section */}
             <div className="mb-16">
                 <div className="text-center mb-8">
                     <h2 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white">{jsonEditorText.features_title || ''}</h2>
                     <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">{jsonEditorText.features_desc || ''}</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                         <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{jsonEditorText.feature_1_title || ''}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{jsonEditorText.feature_1_desc || ''}</p>
                     </div>
                     <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                         <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{jsonEditorText.feature_2_title || ''}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{jsonEditorText.feature_2_desc || ''}</p>
                     </div>
                     <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                         <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{jsonEditorText.feature_3_title || ''}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{jsonEditorText.feature_3_desc || ''}</p>
                     </div>
                     <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                         <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{jsonEditorText.feature_4_title || ''}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{jsonEditorText.feature_4_desc || ''}</p>
                     </div>
                     <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                         <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{jsonEditorText.feature_5_title || ''}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{jsonEditorText.feature_5_desc || ''}</p>
                     </div>
                     <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                         <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{jsonEditorText.feature_6_title || ''}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{jsonEditorText.feature_6_desc || ''}</p>
                     </div>
                 </div>
             </div>

             {/* How It Works Section */}
             <div className="mb-16">
                 <div className="text-center mb-8">
                     <h2 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white">{jsonEditorText.howItWorks_title || ''}</h2>
                     <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">{jsonEditorText.howItWorks_desc || ''}</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <div className="text-center p-6">
                         <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                             <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">1</span>
                         </div>
                         <p className="text-gray-500 dark:text-gray-400">{jsonEditorText.howItWorks_step1 || ''}</p>
                     </div>
                     <div className="text-center p-6">
                         <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                             <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">2</span>
                         </div>
                         <p className="text-gray-500 dark:text-gray-400">{jsonEditorText.howItWorks_step2 || ''}</p>
                     </div>
                     <div className="text-center p-6">
                         <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                             <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">3</span>
                         </div>
                         <p className="text-gray-500 dark:text-gray-400">{jsonEditorText.howItWorks_step3 || ''}</p>
                     </div>
                     <div className="text-center p-6">
                         <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                             <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">4</span>
                         </div>
                         <p className="text-gray-500 dark:text-gray-400">{jsonEditorText.howItWorks_step4 || ''}</p>
                     </div>
                 </div>
             </div>

             {/* Testimonials Section */}
             <div className="mb-16">
                 <div className="text-center mb-8">
                     <h2 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white">{jsonEditorText.testimonials_title || ''}</h2>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                         <div className="flex items-center mb-4">
                             <div className="flex-shrink-0">
                                 <img 
                                     src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=faces&auto=format&q=80" 
                                     alt={jsonEditorText.testimonial_1_name || 'User'}
                                     className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                                 />
                             </div>
                             <div className="ml-4">
                                 <div className="font-bold text-gray-900 dark:text-white">{jsonEditorText.testimonial_1_name || ''}</div>
                                 <div className="text-sm text-gray-500 dark:text-gray-400">{jsonEditorText.testimonial_1_role || ''}</div>
                             </div>
                         </div>
                         <p className="text-gray-500 dark:text-gray-400 italic">"{jsonEditorText.testimonial_1_text || ''}"</p>
                     </div>
                     <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                         <div className="flex items-center mb-4">
                             <div className="flex-shrink-0">
                                 <img 
                                     src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=faces&auto=format&q=80" 
                                     alt={jsonEditorText.testimonial_2_name || 'User'}
                                     className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                                 />
                             </div>
                             <div className="ml-4">
                                 <div className="font-bold text-gray-900 dark:text-white">{jsonEditorText.testimonial_2_name || ''}</div>
                                 <div className="text-sm text-gray-500 dark:text-gray-400">{jsonEditorText.testimonial_2_role || ''}</div>
                             </div>
                         </div>
                         <p className="text-gray-500 dark:text-gray-400 italic">"{jsonEditorText.testimonial_2_text || ''}"</p>
                     </div>
                     <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                         <div className="flex items-center mb-4">
                             <div className="flex-shrink-0">
                                 <img 
                                     src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&crop=faces&auto=format&q=80" 
                                     alt={jsonEditorText.testimonial_3_name || 'User'}
                                     className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                                 />
                             </div>
                             <div className="ml-4">
                                 <div className="font-bold text-gray-900 dark:text-white">{jsonEditorText.testimonial_3_name || ''}</div>
                                 <div className="text-sm text-gray-500 dark:text-gray-400">{jsonEditorText.testimonial_3_role || ''}</div>
                             </div>
                         </div>
                         <p className="text-gray-500 dark:text-gray-400 italic">"{jsonEditorText.testimonial_3_text || ''}"</p>
                     </div>
                 </div>
             </div>

             {/* FAQ Section */}
             <div className="mb-8">
                 <div className="text-center mb-8">
                     <h2 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white">{jsonEditorText.faq_title || ''}</h2>
                 </div>
                 <div className="max-w-3xl mx-auto space-y-4">
                     <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                         <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{jsonEditorText.faq_q1 || ''}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{jsonEditorText.faq_a1 || ''}</p>
                     </div>
                     <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                         <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{jsonEditorText.faq_q2 || ''}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{jsonEditorText.faq_a2 || ''}</p>
                     </div>
                     <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                         <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{jsonEditorText.faq_q3 || ''}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{jsonEditorText.faq_a3 || ''}</p>
                     </div>
                     <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                         <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{jsonEditorText.faq_q4 || ''}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{jsonEditorText.faq_a4 || ''}</p>
                     </div>
                     <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                         <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{jsonEditorText.faq_q5 || ''}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{jsonEditorText.faq_a5 || ''}</p>
                     </div>
                 </div>
             </div>
         </div>
       </section>
       <Footer
           locale={locale}
           description={indexLanguageText.description}
           footerText={footerLanguageText}
       />
    </>
  )
}
export default PageComponent
