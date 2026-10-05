import { useCallback, useEffect, useState } from 'react'
import {
  clearTokens,
  createProduct,
  deleteProduct,
  fetchProducts,
  getTokens,
  login,
  logout,
  saveTokens,
  updateProduct,
} from './api'
import './App.css'

const emptyProduct = {
  product_name: '',
  description: '',
  price: '',
  quantity: '',
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mark6_user') || 'https://paglinawanmark-act-6.onrender.com/api')
    } catch {
      return null
    }
  })
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyProduct)
  const [editingId, setEditingId] = useState(null)
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetchProducts()
      setProducts(response.data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (getTokens().accessToken) {
      loadProducts()
    }
  }, [loadProducts])

  async function handleLogin(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await login(identity, password)
      saveTokens(response.tokens)
      setUser(response.user)
      localStorage.setItem('mark6_user', JSON.stringify(response.user))
      setPassword('')
      setNotice('Welcome back.')
      await loadProducts()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function beginEdit(product) {
    setEditingId(product.id)
    setForm({
      product_name: product.product_name,
      description: product.description || '',
      price: product.price,
      quantity: product.quantity,
    })
    setError('')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyProduct)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    const product = {
      ...form,
      price: String(form.price),
      quantity: Number(form.quantity),
    }

    try {
      if (editingId) {
        await updateProduct(editingId, product)
        setNotice('Product updated.')
      } else {
        await createProduct(product)
        setNotice('Product added.')
      }
      cancelEdit()
      await loadProducts()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.product_name}"? This cannot be undone.`)) {
      return
    }

    setError('')
    setNotice('')
    try {
      await deleteProduct(product.id)
      setNotice('Product deleted.')
      if (editingId === product.id) {
        cancelEdit()
      }
      await loadProducts()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function handleLogout() {
    setError('')
    try {
      await logout()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      clearTokens()
      localStorage.removeItem('mark6_user')
      setUser(null)
      setProducts([])
      cancelEdit()
    }
  }

  if (!user) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <div className="brand-mark" aria-hidden="true">M</div>
          <p className="eyebrow">PRODUCT MANAGEMENT</p>
          <h1>Welcome back</h1>
          <p className="muted">Sign in to manage your product inventory.</p>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <form className="stack-form" onSubmit={handleLogin}>
            <label>
              Username or email
              <input
                autoComplete="username"
                value={identity}
                onChange={(event) => setIdentity(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button className="button button-primary button-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="login-footnote">Authenticated by the LavaLust API</p>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Mark Products home">
          <span className="brand-mark">M</span>
          <span>mark<span className="wordmark-light">products</span></span>
        </a>
        <div className="account">
          <span className="account-name">{user.username}</span>
          <button className="button button-quiet" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <section className="welcome-row">
        <div>
          <p className="eyebrow">INVENTORY WORKSPACE</p>
          <h1>Products</h1>
          <p className="muted">Manage your catalog and keep your stock up to date.</p>
        </div>
        <div className="inventory-total">
          <span className="total-number">{products.length}</span>
          <span className="total-label">products</span>
        </div>
      </section>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}

      <div className="workspace">
        <section className="panel form-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{editingId ? 'UPDATE ITEM' : 'NEW ITEM'}</p>
              <h2>{editingId ? 'Edit product' : 'Add a product'}</h2>
            </div>
            {editingId && <button className="text-button" onClick={cancelEdit}>Cancel</button>}
          </div>
          <form className="stack-form" onSubmit={handleSubmit}>
            <label>
              Product name
              <input
                name="product_name"
                maxLength="100"
                value={form.product_name}
                onChange={updateField}
                placeholder="e.g. Canvas tote bag"
                required
              />
            </label>
            <label>
              Description <span className="optional">Optional</span>
              <textarea
                name="description"
                rows="4"
                value={form.description}
                onChange={updateField}
                placeholder="Add a short product description"
              />
            </label>
            <div className="form-grid">
              <label>
                Price
                <div className="input-prefix">
                  <span>$</span>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    max="99999999.99"
                    step="0.01"
                    value={form.price}
                    onChange={updateField}
                    placeholder="0.00"
                    required
                  />
                </div>
              </label>
              <label>
                Quantity
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={form.quantity}
                  onChange={updateField}
                  placeholder="0"
                  required
                />
              </label>
            </div>
            <button className="button button-primary button-full" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add product'}
            </button>
          </form>
        </section>

        <section className="panel list-panel">
          <div className="panel-heading list-heading">
            <div>
              <p className="eyebrow">YOUR CATALOG</p>
              <h2>All products</h2>
            </div>
            <button className="button button-outline" onClick={loadProducts} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          {loading && products.length === 0 ? (
            <div className="empty-state">Loading products…</div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">＋</span>
              <h3>No products yet</h3>
              <p>Add your first product using the form.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.product_name}</strong>
                        {product.description && <span className="product-description">{product.description}</span>}
                      </td>
                      <td className="price-cell">${Number(product.price).toFixed(2)}</td>
                      <td>
                        <span className={`stock-pill ${Number(product.quantity) === 0 ? 'stock-empty' : ''}`}>
                          {product.quantity} in stock
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button className="text-button" onClick={() => beginEdit(product)}>Edit</button>
                        <button className="text-button text-danger" onClick={() => handleDelete(product)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <footer className="footer">
        <span>Mark Product Management</span>
        <span>Powered by LavaLust API</span>
      </footer>
    </main>
  )
}

export default App
