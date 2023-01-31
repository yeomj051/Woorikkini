import React, { useRef, useState } from 'react';
import './CreateCard.css';
// import axios from 'axios';
import Modal from '../Modal';

function CreateCard({ addCard }) {
  // useState를 사용하여 open상태를 변경한다. (open일때 true로 만들어 열리는 방식)
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = () => {
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
  };

  const [fileData, setFileData] = useState([]);
  const [imgFile, setImgFile] = useState('');
  const imgRef = useRef();
  const [titleData, setTitleData] = useState('');
  const [contentData, setContentData] = useState('');

  const onFile = (event) => {
    // console.log('?', event.target.files);
    setFileData([...fileData, event.target.value]);
    // console.log('@', imgRef.current.files[0]);
    const file = imgRef.current.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setImgFile(reader.result);
    };
  };
  const onTitle = (event) => {
    setTitleData(event.currentTarget.value);
  };
  const onContent = (event) => {
    setContentData(event.currentTarget.value);
  };

  const memoryRegister = (event) => {
    event.preventDefault();
    // const formData = { img: fileData, title: titleData, content: contentData };
    const formData = [imgFile, titleData, contentData];
    addCard(formData);
    console.log('@@', formData);
    setImgFile('');
    setFileData([]);
    setTitleData('');
    setContentData('');
    setModalOpen(false);
    // fetch('http:// /memory', {
    //   method: 'POST',
    //   body: {
    //     fileData,
    //     titleData,
    //     contentData,
    //   },
    // })

    // 서버로 전달
    // axios
    //   .post('http:// /memory', {
    //     headers: {},
    //     data: {
    //       img: fileData,
    //       title: titleData,
    //       content: contentData,
    //     },
    //   })
    //   .then(() => {
    //     setModalOpen(false);
    //     alert('새로운 추억이 등록되었습니다.');
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //     alert('다시 시도해주시기 바랍니다.');
    //   });
  };

  return (
    <React.Fragment>
      {/* //header 부분에 텍스트를 입력한다. */}
      <div className="create-card">
        <div onClick={openModal}>
          <p>+</p>
          <p>추가하기</p>
        </div>
      </div>
      <Modal open={modalOpen} close={closeModal} register={memoryRegister} header="기록하기">
        {/* // Modal.js <main> {props.children} </main>에 내용이 입력된다.  */}
        <form className="memory">
          <input
            // value={fileData}
            type="file"
            multiple
            accept="image/*"
            id="profileImg"
            onChange={onFile}
            ref={imgRef}
          />
          <div className="photo">
            {imgFile ? <img src={imgFile} style={{ width: 250, height: 300 }} /> : <div></div>}
          </div>
          <input value={titleData} onChange={onTitle} style={{ width: 300 }} placeholder="제목을 입력하세요."></input>
          <br />
          <textarea
            value={contentData}
            onChange={onContent}
            style={{ width: 300, height: 100 }}
            placeholder="내용을 입력하세요."
          ></textarea>
        </form>
      </Modal>
    </React.Fragment>
  );
}

export default CreateCard;
