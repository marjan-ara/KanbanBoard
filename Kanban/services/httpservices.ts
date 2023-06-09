import axios from 'axios'

axios.defaults.headers.post['Content-Type'] = 'application/json'
axios.defaults.headers['OData-MaxVersion'] = '4.0'
axios.defaults.headers['OData-Version'] = '4.0'

axios.interceptors.response.use(null, (error) => {
  // const isErrorExpected =
  //   error.response &&
  //   error.response.status >= 400 &&
  //   error.response.status < 500
  return Promise.reject(error)
})

export default {
  get: axios.get,
  post: axios.post,
  put: axios.put,
  delete: axios.delete
}
