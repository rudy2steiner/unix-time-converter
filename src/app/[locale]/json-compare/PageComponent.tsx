'use client'
import {useRouter} from "next/navigation";
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import {useState,useEffect,useCallback,useRef} from "react";
import HeadInfo from "~/components/HeadInfo";
import {useCommonContext} from "~/context/common-context";
import {useInterval} from "ahooks";
import Link from "next/link";
import Script from 'next/script'
import { languages,getLanguageByLang,getEditorLocale} from "~/config";
import {Editor,loader,useMonaco,DiffEditor} from "@monaco-editor/react";

loader.config({ paths: { vs: "/vs" } });
const PageComponent = ({
                         locale = '',
                         indexLanguageText,
                         footerLanguageText,
                         jsonCompareText
                       }) => {
  const lang = getEditorLocale(locale);
  const diffEditorRef = useRef(null);

  function handleEditorDidMount(editor, monaco) {
      diffEditorRef.current = editor;
  }
  function format(e) {
      e.preventDefault()
      diffEditorRef.current.getOriginalEditor().trigger('', 'editor.action.formatDocument');
      diffEditorRef.current.getModifiedEditor().trigger('', 'editor.action.formatDocument');
  }
  const options= {
    originalEditable: true
  }
  return (
    <>
      <HeadInfo
        title={jsonCompareText.title}
        description={jsonCompareText.description}
        keywords={jsonCompareText.keywords}
        locale={locale}
        page={"/json-compare"}
      />
    <Header locale={locale} page={"json-compare"} indexLanguageText={indexLanguageText}/>
    <p className="text-black text-center text-xl mb-3 mt-5">{jsonCompareText.h1}</p>
    <div className="mx-auto w-[80%]  h-[100%] border-blue-200 border-2 mb-2 ">
      <div className="">
        <DiffEditor
          height="60vh"
          language="json"
          original="hi"
          modified="hello"
          options={options}
          onMount={handleEditorDidMount}
        />
      </div>
      <div className="flex justify-between pt-2 pb-2">
        <div className="flex-shrink-0">
          <button  onClick={format} className="btn btn-outline btn-sm btn-primary ml-5">
            {jsonCompareText.format}
          </button>
        </div>
      </div>
    </div>
    <Footer
        locale={locale}
        description={indexLanguageText.description}
        footerText={footerLanguageText}
    />
    </>
  )
}
export default PageComponent
