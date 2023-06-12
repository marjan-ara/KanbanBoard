import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getOwners } from '../../services/services'
import { IOwner } from '../../interfaces'
import { IInputs } from '../../generated/ManifestTypes'

export const getAllOwnersAsync = createAsyncThunk(
  'owners/getAll',
  (context: ComponentFramework.Context<IInputs>): IOwner[] => {
    let res = getOwners(context)
    if (!res) res = []
    return res
  }
)

interface IOwnerState {
  list: IOwner[]
  isLoading: boolean
  hasError: boolean
}

const initialState: IOwnerState = {
  list: [],
  isLoading: false,
  hasError: false
}
const ownerSlice = createSlice({
  name: 'owner',
  initialState: initialState,
  extraReducers: (builder) => {
    builder
      .addCase(getAllOwnersAsync.pending, (state) => {
        state.isLoading = true
        state.hasError = false
      })
      .addCase(getAllOwnersAsync.fulfilled, (state, action) => {
        state.list = action.payload
        state.isLoading = false
        state.hasError = false
      })
      .addCase(getAllOwnersAsync.rejected, (state) => {
        state.hasError = true
        state.isLoading = false
      })
  },
  reducers: {
    getAllOwners: (state, action) => {
      const res = getOwners(action.payload)
      state.list = res
    }
  }
})

export default ownerSlice.reducer
export const { getAllOwners } = ownerSlice.actions
