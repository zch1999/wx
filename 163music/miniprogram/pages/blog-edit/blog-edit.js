// 输入文字最大数
const MAX_WORDS_NUM = 140
//最大上传图片数量
const MAX_IMG_NUM = 9
//内容
let content = ''
//个人信息
let userInfo = {}
const db = wx.cloud.database()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    wordsNum: 0,
    footerBottom: 0,
    images: [],
    selectPhoto: true,
  },

  onInput(event){
    // console.log(event.detail.value)
    let wordsNum = event.detail.value.length
    if(wordsNum >= MAX_WORDS_NUM){
      wordsNum = `最大字数为${MAX_WORDS_NUM}`
    }
    this.setData({
      wordsNum
    })
    content = event.detail.value
  },

//得到焦点
  onFocus(event){
    // console.log(event)
    this.setData({
      footerBottom: event.detail.height
    })
  },

//失去焦点
  onBlur(){
    this.setData({
      footerBottom: 0
    })
  },

//选择图片
  onChooseImage(){
    let max = MAX_IMG_NUM - this.data.images.length
    wx.chooseImage({
      count: max,
      sizeType:  ['original','compresssed'],
      sourceType:['album','camera'],
      success:(res) =>{
        console.log(res)
        this.setData({
          images: this.data.images.concat(res.tempFilePaths)
        })
        max = MAX_IMG_NUM - this.data.images.length
        if(max == 0){
          this.setData({
            selectPhoto: max <= 0 ? false : true
          })
        }
      },
    })
  },

//删减图片
  onDelImage(event){
    this.data.images.splice(event.target.dataset.index, 1)
    this.setData({
      images: this.data.images
    })
    if (this.data.images.length == MAX_IMG_NUM - 1){
      this.setData({
        selectPhoto: true
      })
    }
  },

//预览图片
  onPreviewImage(event){
    wx.previewImage({
      urls: this.data.images,
      current:event.target.imgsrc
    })
  },

  send(){
    //2，数据 -> 云数据库
    //数据库：内容，图片fileID,openid,昵称，头像，时间
    //1，图片 -> 云存储 返回fileID 云文件id

    if(content.trim() === ''){
      wx.showModal({
        title: '请输入内容',
        content: '',
      })
      return
    }

    wx.showLoading({
      title: '发布中',
    })

    let promiseArr = []
    let fileIds = []
    //图片上传
    for(let i = 0, len = this.data.images.length; i< len; i++){
      let p = new Promise((resolve,reject)=>{
        let item = this.data.images[i]
        let suffix = /\.\w+$/.exec(item)[0]
        wx.cloud.uploadFile({
          cloudPath: 'blog/' + Date.now() + '-' + Math.random() * 10000000 + suffix,
          filePath: item,
          success: (res) => {
            console.log(res)
            fileIds = fileIds.concat(res.fileID)
            resolve()
          },
          fail: (err) => {
            console.log(err)
            reject()
          }
        })
      })
      promiseArr.push(p)
    }
    //存入云数据库
    Promise.all(promiseArr).then((res)=>{
      db.collection('blog').add({
        data:{
          ...userInfo,
          content,
          img: fileIds,
          createTime: db.serverDate() //服务端时间
        }
      }).then((res)=>{
        wx.hideLoading()
        wx.showToast({
          title: '发布成功',
        })
        
        //返回blog页面，并且刷新
        wx.navigateBack({
          
        })
      }).catch((err)=>{
        wx.hideLoading()
        wx.showToast({
          title: '发布失败',
        })
      })
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // console.log(options)
    userInfo = options
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})